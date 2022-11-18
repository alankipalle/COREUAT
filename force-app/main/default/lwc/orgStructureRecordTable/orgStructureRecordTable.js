import { LightningElement, wire, track, api } from 'lwc';
import getOrgStructures from '@salesforce/apex/OrgStructureRecordController.getOrgStructureRecordsByAccount';
import { updateRecord,deleteRecord  } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
//define row actions
const actions = [    
    { label: 'Delete', name: 'delete' }
];
 
// columns
const columns = [
    {
        label: 'Name',
        fieldName: 'Name',
        type: 'text',
    }, {
        label: 'Line of Business',
        fieldName: 'Line_of_Business__c',
        type: 'text',
        editable: true,
    }, {
        label: 'Division',
        fieldName: 'Division__c',
        type: 'text',
        editable: true,
    }, {
        label: 'Business Unit',
        fieldName: 'Business_Unit__c',
        type: 'text',
        editable: true
    },
    {
        label: 'Inactive',
        fieldName: 'Active__c',
        type: 'boolean',
        editable: true
    }
];

export default class OrgStructureRecordTable extends LightningElement {
    columns = columns;
    @track records;
    saveDraftValues = [];
    showSpinner;

    @api recordId;
 
    @wire(getOrgStructures, { accountId: '$recordId' })
    orgData(result) {
        this.records = result;
        console.log('Result:' + JSON.stringify(result));
        if (result.error) {
            this.records = undefined;
            console.log(result.error);
        }
    };
    

    handleRowActions(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;        
        switch (actionName) {            
            case 'delete':
                this.delete(row);
                break;
        }
    }
 
    handleSave(event) {
        this.saveDraftValues = event.detail.draftValues;
        console.log(JSON.stringify(this.saveDraftValues) );
        const recordInputs = this.saveDraftValues.slice().map(draft => {
            const fields = Object.assign({}, draft);            
            return { fields };
        });
 
        // Updateing the records using the UiRecordAPi
        const promises = recordInputs.map(recordInput => updateRecord(recordInput));
        Promise.all(promises).then(res => {
            this.ShowToast('Success', 'Records Updated Successfully!', 'success', 'dismissable');
            this.saveDraftValues = [];
            return this.refresh();
        }).catch(error => {
            this.ShowToast('Error', 'An Error Occured!!', 'error', 'dismissable');
        }).finally(() => {
            this.saveDraftValues = [];
        });
    }
 
    ShowToast(title, message, variant, mode){
        const evt = new ShowToastEvent({
                title: title,
                message:message,
                variant: variant,
                mode: mode
            });
            this.dispatchEvent(evt);
    }
 
    // This function is used to refresh the table once data updated
    async refresh() {
        await refreshApex(this.records);
    }

    delete(row) {
        this.showSpinner = true;
        deleteRecord(row.Id)
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Record deleted',
                        variant: 'success'
                    })
                ); 
                this.showSpinner = false;
                return this.refresh();
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error deleting record',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
                this.showSpinner = false;
            });
    }

    
}