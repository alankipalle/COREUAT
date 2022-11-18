import { LightningElement, wire, api } from 'lwc';
import getMatchingRecordsData from '@salesforce/apex/iwsManager.matchingRecords';
import { getRecord, updateRecord } from "lightning/uiRecordApi";
import NAME_FIELD from "@salesforce/schema/Apprenticeship__c.Name";
import IWS_FIELD from "@salesforce/schema/Apprenticeship__c.InternshipWorkSite__c";
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const FIELDS = [NAME_FIELD, IWS_FIELD];

const COLS = [
    {
        label: 'Name',
        fieldName: 'iwsName', type: 'url',
        typeAttributes: {
            label: { fieldName: 'Name' },
            target: '_blank'
        },
        sortable: true
    },
    {
        label: 'Internship Name',
        fieldName: 'internshipURL', type: 'url',
        typeAttributes: { label: { fieldName: 'internshipName' }, target: '_blank' }
    },
    { label: 'Student Name', fieldName: 'Matching_Student_Name__c' },
    { label: 'Seat Name', fieldName: 'Matching_Seat_Name__c' },
    { label: 'Finalize Match', fieldName: 'Finalize_Match__c', type: 'boolean', editable: true },
    { label: 'Match Status', fieldName: 'Match_Status__c', editable: true }
];
export default class IwsMatchingRecords extends LightningElement {
    columns = COLS;
    error;
    records = [];
    header = 'No Records Found';
    body = 'No Matching match records found with status Match';
    @api iwsId;
    @api recordId;
    internshipid;
    wiredMatchRecords;
    recordCount = 0;
    internship;
    internshipRecord;
    draftValues = [];
    @api currentView = "Matching Tool";
    showSpinner=false;

    connectedCallback() {
        console.log(this.currentView);
        this.showSpinner = true;
        if (this.currentView === 'IWS') {
            this.iwsId = this.recordId;
        } else if (this.currentView === 'Internship') {
            this.internshipid = this.recordId;
        }
    }

    // Update wire method
    @wire(getRecord, { recordId: '$internshipid', fields: FIELDS })
    internRecord(result) {
        this.internshipRecord = result;
        if (result.error) {
            //some code
        } else if (result.data) {
            this.internship = result.data;          
            this.iwsId = this.internship.fields.InternshipWorkSite__c.value;
        }
    }


    @wire(getMatchingRecordsData, { iwsId: '$iwsId' })
    wiredMatchRecord(result) {
        this.wiredMatchRecords = result
        if (result.data) {
           
            this.records = result.data.map(
                record => ({
                    ...record,
                    iwsName: '/' + record.Id,
                    internshipName: record.Matching_Seat__r.Internship__c ? record.Matching_Seat__r.Internship__r.Name : '',
                    internshipURL: record.Matching_Seat__r.Internship__c ? '/' + record?.Matching_Seat__r.Internship__c : '',
                    internshipId: record.Matching_Seat__r.Internship__c
                })
            );

            if(this.records.length===0) {
                this.showSpinner = false;
                return;
            }
          
            if (this.currentView === 'Internship') {             
                let filteredRecords = this.records.filter(r => !r.internshipId || r.internshipId == this.recordId);               
                this.records = filteredRecords;
            }

            this.dispatchEvent(new CustomEvent("matchingrecords", {
                detail: this.records
            }));    

            this.recordCount = this.records.length;       
            this.showSpinner = false;
        } else if (result.error) {
            this.records = undefined;          
            this.error = JSON.stringify(result.error);

            this.showSpinner = false;
        }
    }

    saveHandler(event) {
        return this.refresh();
    }

    async refresh() {
        await refreshApex(this.internshipRecord);
        await refreshApex(this.wiredMatchRecords);
    }

    get showDetails() {
        return this.recordCount > 0 ? true : false;
    }


}