import { LightningElement, wire } from 'lwc';
import retreieveObjects from '@salesforce/apex/ValidationruleController.retreieveObjects';
import retreieveValidationRules from '@salesforce/apex/ValidationruleController.getValidationRules';
import retreieveMetadata from '@salesforce/apex/ValidationruleController.getValidationRuleMetadata';
import deleteValidationRules from '@salesforce/apex/ValidationruleController.deleteValidationRules';
import retreieveFields from '@salesforce/apex/ValidationruleController.getObjectInfo';
import { refreshApex } from '@salesforce/apex';

/** The delay used when debouncing event handlers before invoking Apex. */
const DELAY = 300;
const columns = [
    { label: 'Name', fieldName: 'ValidationName' },
    { label: 'ErrorMessage', fieldName: 'ErrorMessage', type: 'string' },
    { label: 'Description', fieldName: 'Description', type: 'string' },
    { label: 'ErrorDisplayField', fieldName: 'ErrorDisplayField', type: 'string' },
    { label: 'Active', fieldName: 'Active', type: 'boolean' },
    {
        label: 'Preview',
        type: 'button-icon',
        typeAttributes:
        {
            iconName: 'utility:preview',
            name: 'Preview'
        }
    }
];

export default class ValidationruleManager extends LightningElement {
    items = [];
    error;
    delayTimeout;
    value = 'Account';
    validationRuleData = [];
    columns = columns;
    recordCount = 0;
    metadata;
    selectedId;
    selectedRules;
    wiredValidations;
    showSpinner = false;
    editmode=false;
    //retrieve object information to be displayed in combo box and prepare an array
    @wire(retreieveObjects)
    wiredObjects({ error, data }) {
        if (data) {
            //new efficient method with map, looking through each element
            data.map(element => {
                this.items = [...this.items, {
                    value: element.QualifiedApiName,
                    label: element.MasterLabel
                }];
            });
            console.log(this.items);
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.items = undefined;
        }
    }



    //retrieve combo-box values as status options
    get statusOptions() {
        return this.items;
    }


    //this method is fired based on combo-box item selection
    handleChange(event) {
        // get the string of the "value" attribute on the selected option
        const selectedOption = event.detail.value;
        selectedOption.replace('__c', '');
        this.value = selectedOption;

        //deplay the processing
        window.clearTimeout(this.delayTimeout);

        this.delayTimeout = setTimeout(() => {
            this.value = selectedOption;
        }, DELAY);
        this.showSpinner = true;
    }

    handleEdit(event){
        console.log('edit button is clicked')
        this.editmode = !this.editmode;
    }


    handleRowAction(event) {
        // contains properties of the clicked row
        const row = event.detail.row;
        console.log(row.Id);
        this.selectedId = row.Id;
    }

    //retrieve field information based on selected object API name.
    @wire(retreieveValidationRules, { sObjectName: '$value' })
    wiredRules(result) {
        this.wiredValidations = result;
        if (result.data) {

            const validationData = JSON.parse(result.data);
            this.recordCount = validationData.totalSize;
            this.validationRuleData = validationData.records;
            this.selectedId = this.validationRuleData[0].Id;
            this.error = undefined;
            this.showSpinner = false;
        } else if (result.error) {
            console.log(result.error);
            this.error = result.error;
            this.showSpinner = false;
        }
    }

    //retrieve field information based on selected object API name.
    @wire(retreieveFields, { objectName: '$value' })
    wiredFields(result) {

        if (result.data) {
            const fieldData = JSON.parse(result.data);
            console.log('fieldData: ' + JSON.stringify(fieldData));
            this.error = undefined;
            this.showSpinner = false;
        } else if (result.error) {
            console.log(result.error);
            this.error = result.error;
            this.showSpinner = false;
        }
    }

    //retrieve field information based on selected object API name.
    @wire(retreieveMetadata, { ruleID: '$selectedId' })
    wiredRuleMetadata({ error, data }) {
        if (data) {
            const validationData = JSON.parse(data);
            this.metadata = validationData.records[0].Metadata;
            this.error = undefined;
        } else if (error) {
            console.log(error);
            this.error = error;
        }
    }

    get tableName() {
        return 'Validation Rules(' + this.recordCount + ')'
    }

    deleteHandler() {
        this.showSpinner = true;
        var selectedRecords = this.template.querySelector("lightning-datatable").getSelectedRows();
        if (selectedRecords.length > 0) {
            let ids = '';
            selectedRecords.forEach(currentItem => {
                ids = ids + ',' + this.value + '.' + currentItem.ValidationName;
            });
            this.selectedRules = ids.replace(/^,/, '');

            console.log(this.selectedRules);

            this.deleteValidations();
        }
    }

    refreshInternships() {
        refreshApex(this.wiredValidations);
    }

    deleteValidations() {
        deleteValidationRules({ rules: this.selectedRules })
            .then((result) => {
                console.log(result);
                this.refreshInternships();
                this.showSpinner = false;
            })
            .catch((error) => {
                this.error = error;
                this.showSpinner = false;
            });
    }
}