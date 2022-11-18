import { LightningElement, track, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRelatedListRecords } from 'lightning/uiRelatedListApi';
import fetchSearchData from '@salesforce/apex/iwsManager.fetchSearchData';
import processInternships from '@salesforce/apex/iwsManager.processInternships';
import LightningConfirm from 'lightning/confirm';
import InternMoveError from '@salesforce/label/c.IM_MOVE_MESSAGE';
import RecordMoveSuccess from '@salesforce/label/c.IM_RECORD_MOVE_SUCCESS';

const internshipfields = ['Apprenticeship__c.Id', 'Apprenticeship__c.Active_ABILA_Customer_Number__c', 'Apprenticeship__c.Name', 'Apprenticeship__c.Track__c', 'Apprenticeship__c.Job_Category__c'];


export default class InternPicker extends LightningElement {


    //A list of all cases for all status
    @track sourceIWSIntList;
    @api sourceRecord;
    @api targetIWSId;

    btnDiable = false;
    targetIWSIntList;
    targetrecordCount;
    sourcerecordCount;
    showSpinner;
    sourceWiredRecords;
    targetWiredRecords;
    typeOfLookup = 'source';
    lookupId;
    move = InternMoveError;
    @track selectedRecords = [];
    billingStatus = ['Stage 1 - No Billing Form Submitted to Finance - CE Submit Billing Form', 'Stage 1A - Billing Forms Pending Partner Review - CE to Obtain'];
    iwssearchKey = '';
    iwsFields = 'Name';
    subTitleFields = 'Site_Located__c,Site_Located__r.Name,Cohort__c,BillingReady__c,BillingConfirmationStatus__c,Specialty__c,TrackFamily__c';
    filter = '';
    _iws;
    billingReady = false;
    targetRecord;
    sourceIWSId;
    _isModalOpen = false;

    @api
    get iws() {
        return this._iws;
    }
    set iws(value) {
        this._iws = value;
        this.filter = 'Account__c=' + '\'' + this.iws.Account__c + '\'';
        this.lookupId = this._iws.Id;
        this.sourceIWSId = this._iws.Id;
        this.sourceRecord = this._iws;
        this.billingReady = this._iws.BillingConfirmationStatus__c != undefined && this._iws.BillingConfirmationStatus__c != null && (!this.billingStatus.includes(this._iws?.BillingConfirmationStatus__c) || this._iws.BillingReady__c === true);

    }

    @api
    get isModalOpen() {
        return this._isModalOpen;
    }
    set isModalOpen(value) {
        this._isModalOpen = value;
    }

    closeModal() {
        this._isModalOpen = false;
        this.dispatchEvent(new CustomEvent("close"));
    }


    showModalBox() {
        this._isModalOpen = true;
    }

    closeModal() {
        this._isModalOpen = false;
        this.dispatchEvent(new CustomEvent("close"));
    }

    // wire function property to fetch search record based on user input
    @wire(fetchSearchData, { searchTerm: '$iwssearchKey', fields: '$subTitleFields', filter: '$filter', sObjectName: 'internship_work_Site__c' })
    iwsearchResult;

    @wire(getRelatedListRecords, {
        parentRecordId: '$lookupId',
        relatedListId: 'Internships__r',
        fields: internshipfields
    }) targetlistInfo({ error, data }) {
        if (data) {
            let tempRecords = this._internRecords(data);
            if (this.typeOfLookup === 'target') {
                this.targetIWSIntList = tempRecords;
                this.targetrecordCount = data.count;
            } else {
                this.sourceIWSIntList = tempRecords;
                this.sourcerecordCount = data.count;
            }
            this.error = undefined;
        } else if (error) {
            this.error = error;
        }
    }

    searchHandler(event) {
        this.iwssearchKey = event.detail;
    }

    _internRecords = (data) => {
        let tempRecords = [];

        data.records.forEach(obj => {
            let tempRecord = {};
            tempRecord.Id = obj.fields.Id.value;
            tempRecord.Name = obj.fields.Name.value;
            tempRecord.Track = obj.fields.Track__c.value;
            tempRecord.Specialty = obj.fields.Job_Category__c.value;
            tempRecord.url = '/' + obj.fields.Id.value;
            tempRecord.selected = false;
            tempRecord.billingNumber = obj.fields.Active_ABILA_Customer_Number__c.value;
            tempRecords.push(tempRecord);

        });
        console.log('INT RECORDS: '+ JSON.stringify(tempRecords));
        return tempRecords;
    }

    lookupRecord(event) {

        const record = event.detail.selectedRecord;

        this.lookupId = record?.Id;
        if (event.target.name === 'target') {
            this.targetRecord = record;
            this.typeOfLookup = 'target';
            if (this.targetRecord !== undefined) {
                if (this.targetRecord.Id === this.sourceRecord?.Id) {
                    this._showToast(this, 'Select different Target', 'Please Select a different IWS', 'error');
                }
            } else {
                console.log('REMOVED')
                this.selectedRecords.length = 0;
                this.targetIWSIntList = undefined;
            }

            console.log('TARGET RECORD: ' + JSON.stringify(this.targetRecord));

        } else {
            this.typeOfLookup = 'source';
            this.sourceRecord = record;
            this.sourceIWSId = record.Id;
        }
    }

    get btnDisable() {
        return this.targetRecord === undefined || this.selectedRecords.length < 1;
    }


    hanldeSelected(event) {
        const record = event.detail;
        console.log('Selected Record: ' + JSON.stringify(record))
        // Highlight
        this.sourceIWSIntList.forEach((element, index) => {
            if (element.Id === record.Id) {
                if (element.selected) {
                    element.selected = false;
                } else {
                    element.selected = true;
                }
            }
        });

        var index = this.selectedRecords.findIndex(function (item) { return item.Id == record.Id })

        if (index > -1) {
            this.selectedRecords.splice(index, 1);
        } else {
            this.selectedRecords.push(record);
        }
    }

    handleClick() {

        LightningConfirm.open({
            message: this.move,
            label: 'Are you sure?',
            theme: 'warning'
        }).then((result) => {
            if (result) {
                this._processRecords();
            }
        });
    }

    get sourceRecordCount() {
        return this.sourceIWSIntList !== undefined ? this.sourceIWSIntList.length : 0;
    }

    get targetRecordCount() {
        return this.targetIWSIntList !== undefined ? this.targetIWSIntList.length : 0;
    }

    _processRecords = () => {
        console.log('Processing Records:');
        this.showSpinner = true;
        const records = this._selectedsObjectRecords();
        processInternships({ internships: records, dmlType: 'update' })
            .then(result => {
                console.log(result);
                this._showToast(this, RecordMoveSuccess, 'success', 'Success');
                this.dispatchEvent(new CustomEvent("success", {
                    detail: "SUCCESS"
                }));

                this._removeRecords();
                this.showSpinner = false;
            })
            .catch(error => {
                console.log('Processing Records:' + JSON.stringify(error));
                this.error = error;
                this.showSpinner = false;
                this._handleErrors(error);
            });
    }

    _removeRecords = () => {
        this.selectedRecords.forEach(element => {
            var index = this.sourceIWSIntList.findIndex(function (item) { return item.Id == element.Id })

            if (index > -1) {
                this.sourceIWSIntList.splice(index, 1);
                this.targetIWSIntList.push(element);
            }
        });

        this.selectedRecords.length = 0;
    }

    _selectedsObjectRecords = () => {
        const recordInputs = [];
        this.selectedRecords.forEach(element => {
            const record = { 'sobjectType': 'Apprenticeship__c', 'Id': element.Id };

            record.InternshipWorkSite__c = this.targetRecord.Id;
            record.Site_Location__c = this.sourceRecord.Site_Located__c;
            record.Track__c = this.sourceRecord.TrackFamily__c;
            record.Job_Category__c = this.sourceRecord.Specialty__c;


            recordInputs.push(record);
        })

        return recordInputs;
    }

    //Notification utility function
    _showToast = (firingComponent, toastTitle, toastBody, variant) => {
        const evt = new ShowToastEvent({
            title: toastTitle,
            message: toastBody,
            variant: variant
        });
        firingComponent.dispatchEvent(evt);
    }

    _handleErrors = (error) => {

        var fieldErrors = error.body.output?.fieldErrors;

        if (error.body.output?.errors != null) {

            for (let index = 0; index < error.body.output.errors.length; index++) {
                this._showToast(
                    this,
                    "Error on update",
                    error.body.output.errors[index].errorCode + '- ' + error.body.output.errors[index].message,
                    "error"
                );
            }
        }
        if (fieldErrors != null) {

            for (var prop in fieldErrors) {
                var val = Object.values(fieldErrors);
                this._showToast(
                    this,
                    "Error on update",
                    val[0][0]["message"],
                    "error"
                );
            }
        } else {
            this._showToast(
                this,
                "Error on update",
                error.body.message,
                "error"
            );
        }
    }
}