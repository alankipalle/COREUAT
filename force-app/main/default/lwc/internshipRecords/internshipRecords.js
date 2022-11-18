import { LightningElement, wire, api } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import BillingStatusError from '@salesforce/label/c.IM_BILLING_STATUS';
import DeleteError from '@salesforce/label/c.IM_DELETE_MESSAGE';
import InternsInBillingError from '@salesforce/label/c.IM_INTERNS_IN_BILLING';
import InternMoveError from '@salesforce/label/c.IM_MOVE_MESSAGE';
import RecordMoveSuccess from '@salesforce/label/c.IM_RECORD_MOVE_SUCCESS';
import SelectOneRecord from '@salesforce/label/c.IM_SELECT_ONE_RECORD';
import RecordDeleteSuccess from '@salesforce/label/c.IM_RECORD_DELETED_SUCCESS';
import { getRecord } from "lightning/uiRecordApi";
import fetchRecords from '@salesforce/apex/iwsManager.getInternships';
import fetchSearchData from '@salesforce/apex/iwsManager.fetchSearchData';
import processInternships from '@salesforce/apex/iwsManager.processInternships';
import TRACK_FIELD from "@salesforce/schema/Internship_Work_Site__c.TrackFamily__c";
import SPECIALTY_FIELD from "@salesforce/schema/Internship_Work_Site__c.Specialty__c";
import ORG_FIELD from "@salesforce/schema/Internship_Work_Site__c.Org_Structure__c";
import SITE_FIELD from "@salesforce/schema/Internship_Work_Site__c.Site_Located__c";
import LightningConfirm from 'lightning/confirm';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
const fields = [TRACK_FIELD, SPECIALTY_FIELD, ORG_FIELD, SITE_FIELD];

const internshipColumns = [
    {
        label: 'Name',
        fieldName: 'intName', type: 'url',
        typeAttributes: {
            label: { fieldName: 'Name' },
            target: '_blank'
        },
        sortable: true
    },
    {
        label: 'Student Name',
        fieldName: 'studentURL', type: 'url',
        typeAttributes: { label: { fieldName: 'studentName' }, target: '_blank' }
    },
    { label: 'Specialty', fieldName: 'Job_Category__c' },
    { label: 'Active Billing ID', fieldName: 'Active_ABILA_Customer_Number__c' },
    { label: 'Track', fieldName: 'Track__c' },
    { label: 'Seat Filled By', fieldName: 'Seat_filled_by__c' },
    { label: 'Last Modified Date', fieldName: 'LastModifiedDate', type: 'datetime' }
];



export default class InternshipRecords extends LightningElement {
    @api iwsId;
    internshipColumns = internshipColumns;
    internshipRecords = [];
    wiredInternRecords;
    move = InternMoveError;
    delete = DeleteError;
    error;
    targetRecordID;
    showSpinner = false;
    selectedRecords = [];
    header = 'No Records Found';
    body = 'No Internship records found for this IWS record'
    isShowModal = false;
    showAccLookup = true;
    selectedAccId;
    billingStatus = ['Stage 1 - No Billing Form Submitted to Finance - CE Submit Billing Form', 'Stage 1A - Billing Forms Pending Partner Review - CE to Obtain'];

    // DML Type
    dmlType = {
        delete: 'DELETE',
        insert: 'INSERT',
        update: 'UPDATE'
    }

    // Expose the labels to use in the template.
    label = {
        BillingStatusError,
        InternsInBillingError,
        RecordMoveSuccess,
        SelectOneRecord,
        RecordDeleteSuccess
    };

    iwssearchKey = '';
    _targetIWS;
    iwsFields = 'Name';
    subTitleFields = 'Site_Located__r.Name,Cohort__c,Specialty__c,TrackFamily__c';
    sObjectfields = 'Stage__c,Site_Located__r.Name,Cohort__c,Specialty__c,TrackFamily__c';
    sObjectName = 'Internship_Work_Site__c';
    criteria;
    filter = '';
    _iws;

    @api
    get iws() {
        return this._iws;
    }
    set iws(value) {
        this._iws = value;
        this.filter = 'Account__c=' + '\'' + this.iws.Account__c + '\'';
    }

    // Get Target IWS lookup results   
    @wire(fetchSearchData, { searchTerm: '$iwssearchKey', fields: '$sObjectfields', sObjectName: '$sObjectName', filter: '$filter' })
    searchResult;


    @wire(getRecord, { recordId: '$targetRecordID', fields: fields })
    wiredTargetIWSRecord(result) {
        this._targetIWS = result.data;
    }

    searchHandler(event) {
        this.iwssearchKey = event.detail;
    }

    get internshipsStatus() {
        return this.allInterns?.length > 0 ? true : false;
    }

    @api
    refreshInternships() {
        refreshApex(this.wiredInternRecords);
    }

    @wire(fetchRecords, { iwsId: '$iwsId' })
    wiredInternRecords(result) {
        this.wiredInternRecords = result;

        const customlookup = this.template.querySelector("c-yu-custom-lookup");
        if (customlookup) {
            customlookup.clearvalues();
        }

        if (result.data) {
            this.internshipRecords = result.data.map(
                record => ({
                    ...record,
                    intName: '/' + record.Id,
                    studentName: record.Student__c ? record.Student__r.Name : '',
                    studentURL: record.Student__c ? '/' + record?.Student__c : '',
                    siteName: record.Site_Located__r?.Name
                })
            );

        } else if (result.error) {
            this.internshipRecords = undefined;
            this.error = JSON.stringify(result.error);
        }
    }

    get showRecords() {
        return this.internshipRecords.length > 0 ? true : false;
    }

    //3. Wire the output of the out of the box method getRecord to the property account
    @wire(getRecord, {
        recordId: "$targetRecordID",
        fields
    })
    targetIWS;

    _showToast = (message, variant, title) => {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: "sticky"
        });
        this.dispatchEvent(event);
    }

    handleSelectedRows(event) {
        this.selectedRecords = event.detail;
    }

    changeHandler(event) {
        this.targetRecordID = event.target.value;
    }

    lookupRecord(event) {
        const record = event.detail.selectedRecord;
        this.targetRecordID = record?.Id;
    }

    handlePromptClick(event) {
        const name = event.target.name;

        if (!this.billingStatus.includes(this._iws.BillingConfirmationStatus__c) || this._iws.BillingReady__c === true) {
            this._showToast(this.label.BillingStatusError, 'error', 'ERROR');
            return;
        }

        if (this.selectedRecords === null || this.selectedRecords === undefined || this.selectedRecords.length == 0) {
            this._showToast(this.label.SelectOneRecord, 'error', 'ERROR');
            return;
        }

        if (this._checkActiveBilling().length > 0) {
            this._showToast(this.label.InternsInBillingError + this._checkActiveBilling(), 'error', 'ERROR');
            return;
        }

        if (name === 'move') {
            if (this.targetRecordID === null || this.targetRecordID === undefined) {
                this._showToast('Target IWS is not selected.', 'error', 'ERROR');
                this.template.querySelector("c-yu-custom-lookup").setValidation();
                return;
            }
        }

        LightningConfirm.open({
            message: event.target.name === 'move' ? this.move : this.delete,
            label: 'Are you sure?',
            theme: 'warning'
        }).then((result) => {
            if (result) {
                if (name === 'move') {
                    this._processRecords(this.dmlType.update);
                } else {
                    this._processRecords(this.dmlType.delete);
                }
            }
        });
    }

    _checkActiveBilling = () => {
        let ints = '';
        if (this.selectedRecords) {
            this.selectedRecords.map(item => {
                if (item.Active_ABILA_Customer_Number__c != null) {
                    ints += item.Name;
                }
            })
        }
        return ints;
    }

    _processRecords = (dmlType) => {
        this.showSpinner = true;

        const recordInputs = this._selectedsObjectRecords(dmlType);
        processInternships({ internships: recordInputs, dmlType: dmlType })
            .then(result => {
                console.log(result);
                let toastMessage = dmlType === 'UPDATE' ? this.label.RecordMoveSuccess : this.label.RecordDeleteSuccess
                this._showToast(toastMessage, 'success', 'Success');
                this._refresh();
            })
            .catch(error => {
                this.error = error;
                this._refresh();
                this._handleErrors(error);

            });
    }

    handleSuccess() {
        this._refresh();
    }


    _refresh = () => {
        this.dispatchEvent(new CustomEvent("processrecord", {
            detail: "SUCCESS"
        }));

        this.selectedRecords = undefined;
        this.template.querySelector("c-lwc-datatable").clearRows();
        this.showSpinner = false;
        this.refreshInternships();
    }

    _selectedsObjectRecords = (dmlType) => {
        const recordInputs = [];
        this.selectedRecords.forEach(element => {
            const record = { 'sobjectType': 'Apprenticeship__c', 'Id': element.Id };
            if (dmlType === 'INSERT' || dmlType === 'UPDATE') {
                record.InternshipWorkSite__c = this.targetRecordID;
                record.Site_Location__c = this._targetIWS.fields.Site_Located__c.value;
                record.Track__c = this._targetIWS.fields.TrackFamily__c.value;
                record.Job_Category__c = this._targetIWS.fields.Specialty__c.value;
            }

            recordInputs.push(record);
        })

        return recordInputs;
    }

    handleMove() {
        this.isShowModal = true;
    }

    closeModal() {
        this.isShowModal = false;
    }

    _handleErrors = (error) => {

        var fieldErrors = error.body.output?.fieldErrors;

        if (error.body.output?.errors != null) {
            for (let index = 0; index < error.body.output.errors.length; index++) {
                this._showToast(error.body.output.errors[index].errorCode + '- ' + error.body.output.errors[index].message, "error", "Error on update");
            }
        }
        if (fieldErrors != null) {
            for (var prop in fieldErrors) {
                var val = Object.values(fieldErrors);
                this._showToast(val[0][0]["message"], "error", "Error on update");
            }
        } else {
            this._showToast(error.body.message, "error", "Error on update");
        }
    }

}