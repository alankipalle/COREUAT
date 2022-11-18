import { LightningElement, wire, api, track } from 'lwc';
import getUnmatchedStudents from '@salesforce/apex/StudentsController.getUnmatchedStudents';
import STUDENTS_ERROR from '@salesforce/label/c.StudentsError';
import STUDENT_PAGESIZE from '@salesforce/label/c.Matching_UI_Column_Record_Count';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getPicklistValuesByRecordType } from 'lightning/uiObjectInfoApi';
import MATCHING_RULE_OBJECT from '@salesforce/schema/MATCH_Matching_Rule__c';
import ENGAGEMENT_OBJECT from '@salesforce/schema/Engagement__c';
import MATCHING_MATCH_OBJECT from '@salesforce/schema/MATCH_Matching_Match__c';
import MATCH_STATUS from '@salesforce/schema/MATCH_Matching_Match__c.Match_Status__c';
import INTERNSHIP_READINESS_RATING from '@salesforce/schema/Engagement__c.Internship_Readiness_Rating__c';
import TRACKFAMILYNAME_FIELD from '@salesforce/schema/MATCH_Matching_Rule__c.Seat_Track_Family__c';
import SITENAME_FIELD from '@salesforce/schema/MATCH_Matching_Rule__c.Site_Name__c';
import { reduceErrors } from 'c/ldsUtils';
import { refreshApex } from '@salesforce/apex';
import MATCHING_STUDENT_OBJECT from '@salesforce/schema/MATCH_Matching_Student__c';
import MATCH_GROUP_FIELD from '@salesforce/schema/MATCH_Matching_Student__c.Matching_Group__c';
import getLearningCommunityNames from '@salesforce/apex/StudentsController.getLearningCommunityNamesForStudents';
import getAddresses from '@salesforce/apex/StudentsController.getStudentAddresses';
import getSelectedStudentDetails from '@salesforce/apex/StudentsController.getSelectedStudent';
const STUDENT = 'student';
const SEAT = 'seat';

export default class UnmatchedStudents extends LightningElement {

    @track students;
    wiredStudents;
    queryTerm = '';
    visibleSearch = false;
    visibleFilters = false;
    @api studentId;
    selectedId;
    marketOptions;
    trackOptions;
    markets = [];
    tracks = [];
    marketFilter = [];
    trackFilter = [];
    @api _matchBy = STUDENT;
    _selectedSeatId = '';

    pageNumber = 1;
    pageSize = STUDENT_PAGESIZE;
    totalRecords = 0;

    optionsForSiteName;
    siteNameValue;
    siteNameFilter;

    optionsForTrackFamilyName;
    trackNameValue ;
    trackNameFilter;

    matchingGroupValues;
    optionsForMatchingGroup;
    matchingGroupFilter;

    optionsForMatchingStatus;
    matchingStatusValues;
    matchingStatusFilter;

    communityNameValue = '';
    communityNameFilter = '';

    optionsForInternshipReadinessRating;
    readinessNotesValue;
    readinessNotesFilter;

    addressValue = '';
    addressFilter = '';
    data;
    @api matchedStudent;
    errors;
    recordTypeId;
    matchFlag = false;
    @track predictions;
    skey = false;
    isCommunityValueChanged = false;
    isLoading = false;
    filterApplied = false;

    //labels
    label = {
        STUDENTS_ERROR
    };

    @api 
    set selectedSeatId(value){
        this._selectedSeatId = value;
        if(this.matchBy == SEAT){
            this.refreshStudents();
        }
    }

    get selectedSeatId(){
        return this._selectedSeatId;
    }

    @api
    set matchBy(value){
        this._matchBy = value;
        this.refreshStudents();
    }

    get matchBy(){
        return this._matchBy;
    }

    /** Handles Pagination(Previous Page) for the student column */
    handlePreviousPage(){
        this.pageNumber = this.pageNumber - 1;
        refreshApex(this.retrieveStudents());
    }

    /** Handles Pagination(Next Page) for the student column */
    handleNextPage(){
        this.pageNumber = this.pageNumber + 1;
        refreshApex(this.retrieveStudents());
    }

    handleFirstPage(){
        this.pageNumber = 1;
        this.retrieveStudents();
    }
    
    totalPages;
    handleLastPage(){
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        this.pageNumber = this.totalPages;
        this.retrieveStudents();
    }

    //the evnt in the constructor handles the values from child component called textAutoGenerate LWC component
    constructor(){
        super();
        this.template.addEventListener('valueToParent',this.handleChildValueFromTextAutoGenerate.bind(this));
    }

    //function used to handle value from child component called textAutoGenerate LWC component
    handleChildValueFromTextAutoGenerate(e){

        if(this.communityNameValue != '' &&  this.isCommunityValueChanged ==  true){
        this.communityNameValue = e.detail;
        this.isCommunityValueChanged = false;
        this.predictions = [];
        }

        if(this.isAddressChanged == true && this.addressValue != ''){
            this.addressValue = e.detail;
            this.isAddressChanged = false;
            this.predictions = [];
        }
    }

    //function returns the students records from the apex method called in studentsController class after applying the filters and search terms
    retrieveStudents(){
        if(this.matchBy == SEAT && this.selectedSeatId == undefined){
            this.students = undefined;
            this.totalRecords = 0;
           var info;
                    info = {
                        studentId: undefined,
                        matchId: undefined
                    };
                   const selectedEvent = new CustomEvent('selected', {
                        detail: info
                    });
                
                this.dispatchEvent(selectedEvent);
                this.isLoading = false;
        }else{
            this.isLoading = true;
        getUnmatchedStudents({ matchBy: this.matchBy, seatId: this.selectedSeatId, queryTerm: this.queryTerm, trackFilter: this.trackFilter, marketFilter: this.marketfilter, siteNameFilter: this.siteNameFilter, trackNameFilter: this.trackNameFilter,communityNameFilter: this.communityNameFilter,readinessNotesFilter: this.readinessNotesFilter,addressFilter: this.addressFilter,matchingGroupFilter:this.matchingGroupFilter,matchingStatusFilter:this.matchingStatusFilter,pageNumber: this.pageNumber, pageSize: this.pageSize })
            .then(result => {
                this.students = result.records;
                this.totalRecords = result.totalRecords;
                var selectedEvent;
                var info;
               
                if(this.students.length){
                    if(this.matchFlag == true && this.matchBy == STUDENT){
                        
                        info = {
                            studentId: this.studentId
                            
                        };
                    }  
                    else if(this.matchBy == SEAT){
                        info = {
                            matchId: this.students[0].matchId
                        };
                    }
                    else{
                        info = {
                            studentId: this.students[0].studentId,
                            matchId: this.students[0].matchId
                        };
                    }
                    this.matchFlag = false;
                    selectedEvent = new CustomEvent('selected', {
                        detail: info
                    });
                    this.isLoading = false;
                }else{
                    
                    info = {
                        studentId: undefined,
                        matchId: undefined
                    };
                    selectedEvent = new CustomEvent('selected', {
                        detail: info
                    });
                }
                
                this.dispatchEvent(selectedEvent);
                this.isLoading = false;
            }).catch(error => {
                this.errors = reduceErrors(error);
                this.isLoading = false;
            });
    }
}

    
    // wire method used to get the object information
    @wire(getObjectInfo, { objectApiName: MATCHING_RULE_OBJECT })
    getobjectInfo(result) {
        if (result.data) {
            const rtis = result.data.recordTypeInfos;
            this.recordTypeId = Object.keys(rtis).find((rti) => rtis[rti].name === 'Master');
        }
    }

    //wire method used to get the picklist values of the specified object from the org
    @wire(getPicklistValuesByRecordType, {
        objectApiName: MATCHING_RULE_OBJECT,
        recordTypeId: '$recordTypeId'
    })
    wiredValues({ error, data }) {
        if (data) {
            this.optionsForSiteName = [{label: '--None--', value: '', selected: true}, ...data.picklistFieldValues[SITENAME_FIELD.fieldApiName].values];
            this.optionsForTrackFamilyName = data.picklistFieldValues[TRACKFAMILYNAME_FIELD.fieldApiName].values;
        } else if(error){
            this.errors = error;
        }
    }

    // wire method used to get the object information
    @wire(getObjectInfo, { objectApiName: ENGAGEMENT_OBJECT })
    getobjectInfo(result) {
        if (result.data) {
            const rtis = result.data.recordTypeInfos;
            this.recordTypeId = Object.keys(rtis).find((rti) => rtis[rti].name === 'Master');
        }
    }

    //wire method used to get the picklist values of the specified object from the org
    @wire(getPicklistValuesByRecordType, {
        objectApiName: ENGAGEMENT_OBJECT,
        recordTypeId: '$recordTypeId'
    })
    pickListValuesForEngagement({ error, data }) {
        if (data) {
            this.optionsForInternshipReadinessRating = [{label: '--None--', value: '', selected: true}, ...data.picklistFieldValues[INTERNSHIP_READINESS_RATING.fieldApiName].values];
        } else if(error){
            this.errors = error;
        }
    }

    // wire method used to get the object information
    @wire(getObjectInfo, { objectApiName: MATCHING_STUDENT_OBJECT })
    getobjectInfo(result) {
        if (result.data) {
            const rtis = result.data.recordTypeInfos;
            this.recordTypeId = Object.keys(rtis).find((rti) => rtis[rti].name === 'Master');
        }
    }

    //wire method used to get the picklist values of the specified object from the org
    @wire(getPicklistValuesByRecordType, {
        objectApiName: MATCHING_STUDENT_OBJECT,
        recordTypeId: '$recordTypeId'
    })
    pickListValuesForMatchingSTudent({ error, data }) {
        if (data) {
            this.optionsForMatchingGroup = [{label: '--None--', value: '', selected: true}, ...data.picklistFieldValues[MATCH_GROUP_FIELD.fieldApiName].values];
        } else if(error){
            this.errors = error;
        }
    } 

    // wire method used to get the object information
    @wire(getObjectInfo, { objectApiName: MATCHING_MATCH_OBJECT })
    getobjectInfo(result) {
        if (result.data) {
            const rtis = result.data.recordTypeInfos;
            this.recordTypeId = Object.keys(rtis).find((rti) => rtis[rti].name === 'Master');
        }
    }

    //wire method used to get the picklist values of the specified object from the org
    @wire(getPicklistValuesByRecordType, {
        objectApiName: MATCHING_MATCH_OBJECT,
        recordTypeId: '$recordTypeId'
    })
    pickListValuesForMatchingMatch({ error, data }) {
        if (data) {
            this.optionsForMatchingStatus = [{label: '--None--', value: '', selected: true}, ...data.picklistFieldValues[MATCH_STATUS.fieldApiName].values];
        } else if(error){
            this.errors = error;
        }
    }

    //function is called when selected the student card to fire event in studentCard LWC component
    handleSelected(event){
        this.selectedId = event.detail;
        const selectedEvent = new CustomEvent('selected', {
            detail: event.detail
        });
        this.dispatchEvent(selectedEvent);
    }

    //function used to refresh the students and set the page to number 1.
    @api
    refreshStudents(){
        this.pageNumber = 1;
        this.retrieveStudents();
    }
   
    //function used to update the match status
    @api
    refreshMatchUpdate(){
        
        this.matchFlag = true;
        
            refreshApex(this.retrieveStudents());
    }

   /** Funtion to fetch selected student's details whenever match status is changed */
    @api
    getCurrentStudentDetails(matchedStudent){
        let currentStudent = matchedStudent
        
       
        getSelectedStudentDetails({  seatId: this.selectedSeatId, studentId: currentStudent})
        .then(result =>{
            
            this.data =  result.records;
            this.data.forEach(result =>{
               
               let tempList = JSON.parse(JSON.stringify(this.students));
               let objIndex = tempList.findIndex((obj => obj.studentId == result.studentId));
              
               if(objIndex != -1){
                tempList[objIndex].potentialMatch = result.potentialMatch;
                tempList[objIndex].possibleMatch = result.possibleMatch;
                tempList[objIndex].matchStatus = result.matchStatus;
               }
               
                this.students = tempList;
                
            });
            
        }).catch(error => {
            this.errors = reduceErrors(error);
        });
    }
    
    //fucntion used to check whether the students are available or not
    get hasStudents(){
        return (this.students != null && this.students.length);
    }

    //function used to show the search bar
    toggleSearch(){
        this.visibleSearch = !this.visibleSearch;
    }

    //function used to display the style of the search icon
    get searchStyle(){
        var iconClass;
        if(this.queryTerm){
            iconClass = 'slds-p-right_x-small blue-icon cursor';
        }else{
            iconClass = 'slds-p-right_x-small cursor';
        }
        return iconClass;
    }

    //function used to show the filter section
    toggleFilters(){
        this.visibleFilters = !this.visibleFilters;
        this.skey = false;
    }

    handleMarketChange(e) {
        this.markets = e.detail.value;
    }

    //function called on change in the matching group field
    handleMatchingGroup(e){
        this.matchingGroupValues = e.detail.value;
    }

    handleTrackChange(e) {
        this.tracks = e.detail.value;
    }

    //function called on change in the Site Name field
    handleSiteName(e){
        this.siteNameValue = e.detail.value;
    }

    //function called on change in the Track Name field
    handleTrackFamily(e){
        this.trackNameValue = e.detail.value;
    }

    //function called on change in the Internship Readiness Rating field
    handleReadinessNotes(e){
        this.readinessNotesValue = e.detail.value;
    }

    //function called on change in the Match Status field
    handleMatchingStatus(e){
        this.matchingStatusValues = e.detail.value;
    }  
    get condition() {
        return this.skey;
    }

    //function called on change in the Community Name field
    handleCommunityName(e){
        this.communityNameValue = e.detail.value; 
        if(this.communityNameValue == "") {
            this.skey=false;
            this.communityNameValue='';
            this.isCommunityValueChanged = false;
        }
        if(this.communityNameValue != ""){
            this.isCommunityValueChanged = true;
        getLearningCommunityNames({
            communityName: this.communityNameValue
        })
        .then(result => {
            this.skey=true;
            this.predictions = result;
        })
        .catch(error => {
            this.errors = reduceErrors(error);
        })  
    } 
    }

    getValue(e){
        this.skey=false;
        this.communityNameValue = e.currentTarget.dataset.community;
    }

    isAddressChanged = false;

    //function called on change in the Address field
    handleAddressValue(e){
        this.addressValue = e.detail.value;
        
        if(this.addressValue == "") {
            this.skey=false;
            this.addressValue='';
            this.isAddressChanged = false;
        }
        if(this.addressValue != ""){
            this.isAddressChanged = true;
            getAddresses({
                address: this.addressValue
            })
            .then(result => {
                this.skey=true;
                this.predictions = result;
            })
            .catch(error => {
                this.errors = reduceErrors(error);
            })
        }
    }

    //function is called when clicked on apply filter icon
    applyFilters(e){
        this.trackFilter = this.tracks;
        this.marketFilter = this.markets;
        this.siteNameFilter = this.siteNameValue;
        this.trackNameFilter =this.trackNameValue;
        this.readinessNotesFilter = this.readinessNotesValue;
        this.communityNameFilter = this.communityNameValue;
        this.addressFilter = this.addressValue;
        this.matchingGroupFilter = this.matchingGroupValues;
        this.matchingStatusFilter = this.matchingStatusValues;
        this.toggleFilters();
        this.refreshStudents();
    }

    resetFilters(e){
        this.siteNameFilter = this.siteNameValue = '';
        this.trackNameFilter = this.trackNameValue = null;
        this.readinessNotesFilter = this.readinessNotesValue = '';
        this.communityNameFilter = this.communityNameValue = '';
        this.addressFilter = this.addressValue = '';
        this.matchingGroupFilter = this.matchingGroupValues = '';
        this.matchingStatusFilter = this.matchingStatusValues = '';
        this.visibleFilters = false;
        this.refreshStudents();
    }

    //function is used to get the filter style
    get filterStyle(){
        var style;
        
        if(this.trackNameFilter != null || this.siteNameFilter  || this.readinessNotesFilter || this.communityNameFilter || this.addressFilter || this.matchingGroupFilter || this.matchingStatusFilter)
          {
            style = 'slds-p-right_x-small blue-icon cursor';
            this.filterApplied = true;
        }else{
            style = 'slds-p-right_x-small cursor';
            this.filterApplied = false;
        }
        return style;
    }

    //event used to handle the value entered in search bar
    handleKeyUp(evt) {
        const isEnterKey = evt.keyCode === 13;
        if (isEnterKey) {
            this.queryTerm = evt.target.value;
            this.pageNumber = 1;
            this.refreshStudents();
        }
    }

    
    handleSearch(evt){
        var searchterm = evt.target.value;

        if(searchterm == ''){
            this.queryTerm = '';
            this.pageNumber = 1;
            this.refreshStudents();
            this.visibleSearch =  false;
        }
    }
}