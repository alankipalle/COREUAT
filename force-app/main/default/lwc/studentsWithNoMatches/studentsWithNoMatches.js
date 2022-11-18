import { LightningElement,track,wire } from 'lwc';
import validateRecords from '@salesforce/apex/MatchingLogViewver.validateStudentsNoMatches';
const columns = [
    { label: 'ID', fieldName: 'Id' },
    { label: 'Name', fieldName: 'Name' }
];

export default class StudentsWithNoMatches extends LightningElement {
    @track cardIcon="standard:account";
    @track cardLabel="1/100";
    @track cardTheme="slds-theme_success";
    @track cardTitle = "Card Title";
    columns = columns;
    expectedCount = 0;
    actualCount = 0;
    missedRecords;
    isModalOpen = false;
    loaded = false;

   
        
    
    get missedCount() {
        return this.expectedCount - this.actualCount;
    }

    get badgeTheme() {
        return (this.expectedCount != this.actualCount) ? 'slds-theme_error' : 'slds-theme_success' ;
    }

    get badeLabel() {
        return (this.expectedCount != this.actualCount) ? 'Action Required' : 'No Action Required' ;
    }

    @wire(validateRecords)
    wiredRecords({ error, data }) {
        if (data) {
            this.expectedCount = data.expectedRecordsCount;
            this.actualCount = data.actualRecordsCount;
            this.missedRecords = data.missedRecords;
           
            this.error = undefined;
            this.loaded = !this.loaded;
        } else if (error) {
            this.error = error;
            this.actualCount = 0;
            this.actualCount = 0;
            this.loaded = !this.loaded;
        }
    }

    handleClick() {       
        this.template.querySelector("c-lwc-model").handleValueChange();
    }
}