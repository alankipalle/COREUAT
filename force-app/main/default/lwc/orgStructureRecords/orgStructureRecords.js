import { LightningElement, api, wire, track } from 'lwc';
import fetchOrgStructures from '@salesforce/apex/OrgStructureRecordController.getOrgStructureRecords';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { reduceErrors } from 'c/ldsUtils';
import { getRecord, getFieldValue, updateRecord } from "lightning/uiRecordApi";
import { refreshApex } from '@salesforce/apex';
import ACCOUNT_NAME from "@salesforce/schema/Contact.Account.Name";
import ACCOUNT_ID from "@salesforce/schema/Contact.AccountId";
import GRAND_PARENT_ACCOUNT from "@salesforce/schema/Contact.npsp__Primary_Affiliation__r.Parent.Name";
import GRAND_PARENT_ID from "@salesforce/schema/Contact.npsp__Primary_Affiliation__r.ParentId";
import CONTACT_NAME from "@salesforce/schema/Contact.Name";
import ORG_STRUCTURE_FIELD from "@salesforce/schema/Contact.Org_Structure__c";
import ORG_STRUCTURE_NAME_FIELD from "@salesforce/schema/Contact.Org_Structure__r.Name";
import ID_FIELD from '@salesforce/schema/Contact.Id';
import IWS_ID_FIELD from '@salesforce/schema/Internship_Work_Site__c.Id';
import IWS_ACCOUNT_FIELD from "@salesforce/schema/Internship_Work_Site__c.Account__r.ParentId";
import IWS_ORG_STRUCTURE_FIELD from "@salesforce/schema/Internship_Work_Site__c.Org_Structure__c";
import IWS_ORG_STRUCTURE_NAME_FIELD from "@salesforce/schema/Internship_Work_Site__c.Org_Structure__r.Name";
const CON_FIELDS = [CONTACT_NAME, ORG_STRUCTURE_NAME_FIELD, ORG_STRUCTURE_FIELD, ACCOUNT_NAME, GRAND_PARENT_ACCOUNT, GRAND_PARENT_ID, ACCOUNT_ID];
const IWS_FIELDS = [IWS_ACCOUNT_FIELD, IWS_ORG_STRUCTURE_NAME_FIELD, IWS_ORG_STRUCTURE_FIELD];
const COLUMNS = [
    { label: 'Name', fieldName: 'Name' },
    { label: 'Business Unit', fieldName: 'Business_Unit__c' },
    { label: 'Division', fieldName: 'Division__c' },
    { label: 'Line of Business', fieldName: 'Line_of_Business__c' },
    {
        label: 'Account Name', fieldName: 'AccountURL', type: 'url',
        typeAttributes: { label: { fieldName: 'AccountName' }, target: '_blank' }
    },
    {
        label: 'Inactive',
        fieldName: 'Inactive__c',
        type: 'boolean'

    }
];

export default class OrgStructureRecords extends LightningElement {
    @api recordId;
    columns = COLUMNS;
    record;
    name;
    @api parentId;
    @api accountId;
    objectAPI;
    orgdata;
    showSpinner;
    selectedRecordId;
    fields;
    _inputValue;
    linkedOrg;
    noRecords;
    error;
    @api noButton = false;
    @api
    set inputValue(value) {
        this._inputValue = value;
    }

    get inputValue() {
        return this._inputValue;
    }

    connectedCallback() {
        this.showSpinner = true;
        if (this._inputValue === 'Contact') {
            this.fields = CON_FIELDS;
        } else {
            this.fields = IWS_FIELDS;
        }
    }

    @wire(getRecord, { recordId: '$recordId', fields: '$fields' })
    wiredRecord({ error, data }) {

        if (error) {
            this.showSpinner = false;
            let message = 'Unknown error';
            if (Array.isArray(error.body)) {
                message = error.body.map(e => e.message).join(',');
            } else if (typeof error.body.message === 'string') {
                message = error.body.message;
            }
            this.error = error;

        } else if (data) {
            this.record = data;

            this.linkedOrg = this.record.fields.Org_Structure__r.displayValue;
            let parentAccountId = this._inputValue === 'Contact' ? this.record.fields.npsp__Primary_Affiliation__r?.value.fields.ParentId?.value : this.record.fields.Account__r?.value.fields.ParentId?.value;
            let AccountId = this._inputValue === 'Contact' ? this.record.fields.npsp__Primary_Affiliation__r?.value.id : this.record.fields.Account__r?.value.id;
            this.parentId = parentAccountId;
            this.accountId = AccountId;
            this.objectAPI = this.record.apiName;
            this.showSpinner = false;


        }
    }

    @wire(fetchOrgStructures, { parentId: '$parentId', accountId: '$accountId' })
    wiredOrgRecord({ error, data }) {
        if (error) {

            let message = 'Unknown error';
            if (Array.isArray(error.body)) {
                message = error.body.map(e => e.message).join(',');
            } else if (typeof error.body.message === 'string') {
                message = error.body.message;
            }

            this.error = error;

        } else if (data) {

            let tempRecs = [];

            data.forEach((record) => {
                let tempRec = Object.assign({}, record);
                if (tempRec.Account__c) {
                    tempRec.AccountName = tempRec.Account__r.Name;
                    tempRec.AccountURL = '/' + tempRec.Account__c;
                }

                tempRecs.push(tempRec);

            });
            this.orgdata = tempRecs;
            this.showSpinner = false;

            this.dispatchEvent(new CustomEvent("orgdata", {
                detail: this.orgdata
            }));

            if (this.orgdata.length === 0) { this.noRecords = true };
        }
    }

    get disableButton() {
        return !this.selectedRecordId || this.showSpinner;
    }

    handleRowSelection = event => {
        var selectedRows = event.detail.selectedRows;
        this.selectedRecordId = selectedRows[0].Id;

        this.dispatchEvent(new CustomEvent("selctedorg", {
            detail: selectedRows[0]
        }));
    }

    handleSubmit() {
        if (this.recordId) {
            this.showSpinner = true;

            const fields = {};
            if (this._inputValue === 'Contact') {
                fields[ID_FIELD.fieldApiName] = this.recordId;
                fields[ORG_STRUCTURE_FIELD.fieldApiName] = this.selectedRecordId;
            } else {
                fields[IWS_ID_FIELD.fieldApiName] = this.recordId;
                fields[IWS_ORG_STRUCTURE_FIELD.fieldApiName] = this.selectedRecordId;
            }


            const recordInput = { fields };

            updateRecord(recordInput)
                .then(() => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Record updated',
                            variant: 'success'
                        })
                    );
                    this.showSpinner = false;
                    const selectedEvent = new CustomEvent('filterstatus', { detail: this.showFilter });
                    // Dispatches the event.
                    this.dispatchEvent(selectedEvent);
                    // Display fresh data in the form
                    return refreshApex(this.wiredRecord);
                })
                .catch(error => {
                    this.error = error;
                    this.showSpinner = false;
                    const errors = reduceErrors(error);

                    let message = 'Unknown error';
                    if (Array.isArray(errors)) {
                        message = errors.join(', ');
                    }


                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error updating record',
                            message: message,
                            variant: 'error'
                        })
                    );
                });
        } else {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error:',
                    message: 'Select a Org Structure record',
                    variant: 'error'
                })
            );
        }
    }
}