import { LightningElement } from 'lwc';
import { subscribe, unsubscribe, onError, setDebugFlag, isEmpEnabled } from 'lightning/empApi';
import missingMatches from '@salesforce/apex/MatchingLogViewver.executeBatchJobStudents';
import errorRecords from '@salesforce/apex/MatchingLogViewver.mathingValidatorRecords';

const columns = [
    { label: 'StudentName', fieldName: 'StudentName' },
    { label: 'SeatName', fieldName: 'SeatName' },
    { label: 'RuleName', fieldName: 'RuleName' }
];

export default class StudentsMissingMatches extends LightningElement {
    channelName = '/event/MATCH_Validation_JOb__e';
    isSubscribeDisabled = false;
    isUnsubscribeDisabled = !this.isSubscribeDisabled;

    subscription = {};

    cardIcon="standard:account";
    cardLabel="1/100";
    cardTheme="slds-theme_success";
    cardTitle = "Card Title";
    columns = columns;
    expectedCount = 0;
    actualCount = 0;
    missedRecords;
    isModalOpen = false;
    loaded = false;
    count = 5;
    timer;
   
        
    
    get missedCount() {
        return this.expectedCount - this.actualCount;
    }

    get badgeTheme() {
        return (this.expectedCount != this.actualCount) ? 'slds-theme_error' : 'slds-theme_success' ;
    }

    get badeLabel() {
        return (this.expectedCount != this.actualCount) ? 'Action Required' : 'No Action Required' ;
    }

    get spinnerLoad(){
        return this.expectedCount==0 ? false : true;
    }

    // Initializes the component
    connectedCallback() {       
        // Register error listener       
        this.registerErrorListener(); 
        this.handleSubscribe();  
        this.validateMatches();  
    }

    validateMatches() {  
        this.loaded = false; 
        missingMatches()
            .then((result) => {
               console.log(result);
              
            })
            .catch((error) => {
                console.log(JSON.stringify(error));
                this.error = error;              
            });
    }

    // Handles subscribe button click
    handleSubscribe() {
        
        // Callback invoked whenever a new event message is received
        let self = this;
        const messageCallback = function(response) {
            
            self.expectedCount=response.data.payload.Expected_Count__c;
            self.actualCount=response.data.payload.Actual_Count__c;
           
            console.log('New message received: ', response.data.payload.Expected_Count__c);
            console.log('New message received: ', JSON.parse(response.data.payload.Error_Records__c));
            console.log('New message received: ', JSON.stringify(response));
            // Response contains the payload of the new message received
           
        };

        

        // Invoke subscribe method of empApi. Pass reference to messageCallback
        subscribe(this.channelName, -1, messageCallback).then(response => {
            // Response contains the subscription information on subscribe call
            console.log('Subscription request sent to: ', JSON.stringify(response.channel));
            this.subscription = response;
            
        });
    }

    // Handles unsubscribe button click
    handleUnsubscribe() {
        // Invoke unsubscribe method of empApi
        unsubscribe(this.subscription, response => {
            console.log('unsubscribe() response: ', JSON.stringify(response));
            // Response is true for successful unsubscribe
        });
    }

    disconnectedCallback(){
        this.handleUnsubscribe();
        
            clearInterval(timer);
        
    }

    handleClick(){

        errorRecords()
            .then((result) => {
               console.log(result);

               let records = [];
               result.forEach(record => {
                   let resultRecord = {};
                   resultRecord.StudentName = JSON.parse(record.Seat__c).Name;
                   resultRecord.SeatName = JSON.parse(record.Student__c).Name;
                   resultRecord.RuleName = JSON.parse(record.Rule__c).Name;
                   // and so on for other fields
                   records.push(resultRecord);
               });
               console.log('Records: ' +records.length);
               this.missedRecords = records;

               this.template.querySelector("c-lwc-model").handleValueChange();
              
            })
            .catch((error) => {
                console.log(JSON.stringify(error));
                this.error = error;              
            });

       
    }

   

    registerErrorListener() {
        // Invoke onError empApi method
        onError(error => {
            console.log('Received error from server: ', JSON.stringify(error));
            // Error contains the server-side error
        });
    }

}