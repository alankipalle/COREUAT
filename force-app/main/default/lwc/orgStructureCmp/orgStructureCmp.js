import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getOrgRecordsWithConsIws from '@salesforce/apex/OrgStructureRecordController.getOrgRecordsWithConsIws';
import { getRecord, updateRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import NAME_FIELD from '@salesforce/schema/Org_Structure__c.Name';
import ACCOUNT_FIELD from '@salesforce/schema/Org_Structure__c.Account__c';
import BUSINESS_UNIT_FIELD from '@salesforce/schema/Org_Structure__c.Business_Unit__c';
import DIVISION_FIELD from '@salesforce/schema/Org_Structure__c.Division__c';
import LINE_OF_BUSINESS_FIELD from '@salesforce/schema/Org_Structure__c.Line_of_Business__c';
import PROFILE_NAME_FIELD from '@salesforce/schema/User.Profile.Name';
import ACCOUNT_OWNER_FIELD from '@salesforce/schema/Account.OwnerId';
import Id from '@salesforce/user/Id';
import { reduceErrors } from 'c/ldsUtils';
import LightningConfirm from 'lightning/confirm';
import EditAccess from '@salesforce/customPermission/Org_Structure_Edit_Access';



const columns = [
    { label: 'Name', fieldName: 'Name', editable: { fieldName: 'editNameField' } },

    {
        label: 'Line of Business',
        fieldName: 'Line_of_Business__c',
        type: 'text',
        editable: { fieldName: 'editLobField' }
    }, {
        label: 'Division',
        fieldName: 'Division__c',
        type: 'text',
        editable: { fieldName: 'editDivisionField' }
    },
    { label: 'Business Unit', fieldName: 'Business_Unit__c',editable: { fieldName: 'editBUField' } },
    { label: 'Inactive', fieldName: 'Inactive__c', type: 'boolean', editable: { fieldName: 'controlEditField' } },
    { label: 'Linked Records', type: 'accordion', fieldName: 'Id', typeAttributes: { recordData: { fieldName: 'items' } }, editable: { fieldName: 'editLinkedField' } }
];

export default class OrgStructureCmp extends LightningElement {
   
    @api recordId;
    nameField = NAME_FIELD;
    account = ACCOUNT_FIELD;
    businessUnit = BUSINESS_UNIT_FIELD;
    division = DIVISION_FIELD;
    lineOfBusiness = LINE_OF_BUSINESS_FIELD;
    businessUnitValue;
    isLoading = false;
    lingOfBusinessValue;
    divisionValue;
    @track records;
    saveDraftValues = [];
    showSpinner;
    recordResult;
    error;
    currentUserProfile;
    accountOwnerId;
    userId = Id;
    dataColumns = columns;
    orgRecordsData;

    // Get the Current logged in USER details
    @wire(getRecord, { recordId: Id, fields: [PROFILE_NAME_FIELD] })
    userDetails({ error, data }) {
        if (data) {
            this.currentUserProfile = data.fields.Profile.value.fields.Name.value;
        } else if (error) {
            this.error = error;
        }
    }

    // Get the Current Account details
    @wire(getRecord, { recordId: '$recordId', fields: [ACCOUNT_OWNER_FIELD] })
    accountDetails({ error, data }) {
        if (data) {
            this.accountOwnerId = data.fields.OwnerId.value;
        } else if (error) {
            this.error = error;
        }
    }

    get showRecordCreate() {
        return (this.accountOwnerId === this.userId) || this.currentUserProfile === 'System Administrator' || this.currentUserProfile === 'CE Super User';
    }

    handleChange(event) {
        const value = event.target.value;
        if (event.target.name === 'businessUnit') {
            this.businessUnitValue = value;
        } else if (event.target.name === 'division') {
            this.divisionValue = value;
        } else if (event.target.name === 'lineOfBusiness') {
            this.lingOfBusinessValue = value;
        }
    }

    handleResetAll() {
        this.businessUnitValue = undefined;
        this.lingOfBusinessValue = undefined;
        this.divisionValue = undefined;
        this.template.querySelectorAll('lightning-input-field').forEach(element => {
            if (element.name != 'accountname') {
                element.value = null;
            }
        });
    }

    get name() {
        let orgStructureName = [this.lingOfBusinessValue, this.divisionValue, this.businessUnitValue].filter(Boolean).join('-');
        return orgStructureName.substring(0, 79);
    }

    get btnDisable() {
        return !this.lingOfBusinessValue && !this.divisionValue && !this.businessUnitValue;
    }

    handleSubmit(event) {
        event.stopPropagation();
        event.preventDefault();

        if (this.businessUnitValue === "" && this.divisionValue === "" && this.lingOfBusinessValue === "") {
            this.showToastEventMessage('Error!', 'One of the following fields is required. Business Unit, Line of Business, Division', 'error');
            this.isLoading = false;
            return;
        }

        this.handlePromptClick(event);
    }

    handlePromptClick(event) {
        LightningConfirm.open({
            message: 'Are you sure you want to save this record as is? When this record is saved it will lock the record and the only way to edit it will be through an IT Ticket. Please confirm this record is correct before continuing.',
            label: 'Are you sure?',
            theme: 'warning'
        }).then((result) => {
            if (result) {
                this.isLoading = true;
                const fields = event.detail.fields;
                this.template
                    .querySelector('lightning-record-edit-form').submit(fields);
                this.refresh();
            }
        });
    }


    handleSuccess(event) {
        this.isLoading = false;
        this.showToastEventMessage('Success!', 'Record Created. ' + event.detail.id, 'success');
        this.handleResetAll();
        this.refresh();
    }

    handleError(event) {
        this.isLoading = false;
        this.showToastEventMessage('Error!', event.detail.detail, 'error');
    }

    //show/hide spinner
    handleIsLoading(isLoading) {
        this.isLoading = isLoading;
    }

    //show ShowToastEvent
    showToastEventMessage(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
    }


    // Get Org Structure Records with Linked Contacts and IWS records
    @wire(getOrgRecordsWithConsIws, { accountId: '$recordId' })
    orgRecordData(result) {
        this.recordResult = result;
        if (result.error) {
            this.orgRecordsData = undefined;
            this.error = result.error;
        } else if (result.data) {
            let tempRecs = [];

            result.data.forEach((record) => {
                let tempRec = Object.assign({}, record);
                tempRec.Id = tempRec.orgRecord.Id;
                tempRec.Name = tempRec.orgRecord.Name;
                tempRec.Business_Unit__c = tempRec.orgRecord?.Business_Unit__c;
                tempRec.Division__c = tempRec.orgRecord?.Division__c;
                tempRec.Inactive__c = tempRec.orgRecord?.Inactive__c;
                tempRec.Line_of_Business__c = tempRec.orgRecord?.Line_of_Business__c;
                tempRec.Id = tempRec.Id;

                if ((this.accountOwnerId === this.userId) || this.currentUserProfile === 'System Administrator' || this.currentUserProfile === 'CE Super User') {
                    tempRec.controlEditField = true;
                } else {
                    tempRec.controlEditField = false;
                }
                
                if ((this.currentUserProfile === 'CE Super User')&& EditAccess){
                    tempRec.editNameField = true;
                    tempRec.editLobField = true;
                    tempRec.editDivisionField = true;
                    tempRec.editBUField = true;
                    tempRec.editLinkedField = true;
                } else{
                    tempRec.editNameField = false;
                    tempRec.editLobField = false;
                    tempRec.editDivisionField = false;
                    tempRec.editBUField = false;
                    tempRec.editLinkedField = false;
                }
                tempRecs.push(tempRec);
            });
            this.orgRecordsData = tempRecs;
        }
    };

    handleSave(event) {
        this.isLoading = true;
        this.saveDraftValues = event.detail.draftValues;

        const recordInputs = this.saveDraftValues.slice().map(draft => {
            const fields = Object.assign({}, draft);
            return { fields };
        });

        // Updating the records using the UiRecordAPi
        const promises = recordInputs.map(recordInput => updateRecord(recordInput));
        Promise.all(promises).then(res => {
            this.ShowToast('Success', 'Records Updated Successfully!', 'success', 'dismissable');
            this.saveDraftValues = [];
            this.isLoading = false;

        }).catch(error => {
            this.error = error;

            const errors = reduceErrors(error);
            let message = 'Unknown error';
            if (Array.isArray(errors)) {
                message = errors.map(e => e.message).join(', ');
            }
            this.ShowToast('Error', errors.join(', '), 'error', 'dismissable');
            this.isLoading = false;
        }).finally(() => {
            this.saveDraftValues = [];
            this.isLoading = false;
            this.refresh();
        });
    }

    ShowToast(title, message, variant, mode) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: mode
        });
        this.dispatchEvent(evt);
    }

    // This function is used to refresh the table once data updated
    async refresh() {
        await refreshApex(this.recordResult);
    }
}