import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import updateMatchStatus from '@salesforce/apex/MatchDetailsController.updateMatchStatus';
import match_error from '@salesforce/label/c.Student_Table_Match_Error';
import match_success from '@salesforce/label/c.Successful_Match';
import empty_table from '@salesforce/label/c.Empty_Student_Table';
const MATCH = 'Match';
const Brand = 'brand';
const MATCH_TO_SEAT = 'Matched to this seat';
const POSSIBLE_MATCH = 'Possible Match';
const POSSIBLE_MATCH_SEAT = 'Possible Matched to this seat';
const NOT_MATCHED_SEAT = 'Not Matched to this seat';
const MATCHED = 'Matched';
const POSSIBLE = 'Possible';
const STUDENT = 'student';
export default class StudentTable extends LightningElement {

    @api totalRecords = 0;
    @api matchId;
    @api container = 'Lightning';
    pageNumber = 1;
    pageSize = 5;
    defaultStudent;
    studentList;
    isMatchUpdated = false;
    _studentTableData;
    _studentId;
    info;
    error = false;
    errorMessage
    /** Labels */
    label = {
        match_error,
        match_success,
        empty_table
    };

    @api
    get studentId() {
        return this._studentId;
    }

    set studentId(value) {

        this._studentId = value;
        this.studentRecords();
    }
    @api
    get studentTableData() {
        return this._studentTableData;
    }

    set studentTableData(value) {

        this._studentTableData = value;
        this.studentRecords();
    }

     /** Function to determine to show the table or not */
    get showTable() {
        return (this.totalRecords > 0) ? true : false;
    }

    /**Funnction to handle the student records to be displayed in student table */
    studentRecords() {
        
        let studentRecords = [];
        let defaultRecords = [];
        if (this.studentTableData != null && this.studentTableData != undefined) {


            this.studentTableData.forEach(record => {
                let studentRecord = {};
                let defaultRecord = {};

                if (record.studentId != this.studentId) {
                    studentRecord.MatchId = record.matchId;
                    studentRecord.Id = record.studentId;
                    studentRecord.Student_Name = record.name;
                    studentRecord.TRACK_FAMILY = record.trackFamilyName;
                    studentRecord.STATUS = record.matchStatus;
                    
                    if(record.imageLink != ''){
                        studentRecord.PROFILE_PIC = record.imageLink;
                        studentRecord.imageCheck = true;
                    }else if(record.imageLink == null || record.imageLink == ''){
                        studentRecord.imageCheck = false;
                    }
                   
                    if (studentRecord.STATUS == MATCH) {
                        studentRecord.matcBranding = Brand;
                        studentRecord.currentStatus = MATCH_TO_SEAT;
                    } else if (studentRecord.STATUS == POSSIBLE_MATCH) {
                        studentRecord.possibleBranding = Brand;
                        studentRecord.currentStatus = POSSIBLE_MATCH_SEAT;
                    } else {
                        studentRecord.currentStatus = NOT_MATCHED_SEAT
                    }
                    studentRecords.push(studentRecord);
                } else {
                    defaultRecord.MatchId = record.matchId;
                    defaultRecord.Id = record.studentId;
                    defaultRecord.Student_Name = record.name;
                    defaultRecord.TRACK_FAMILY = record.trackFamilyName;
                    defaultRecord.STATUS = record.matchStatus;
                    
                    if( record.imageLink != ''){
                        defaultRecord.PROFILE_PIC = record.imageLink;
                        defaultRecord.imageCheck = true;
                    }else if(record.imageLink == null || record.imageLink == ''){
                        defaultRecord.imageCheck = false;
                    }
                    
                    defaultRecord.borderSelected = 'selected_border';
                    if (defaultRecord.STATUS == MATCH) {
                        defaultRecord.matcBranding = Brand;
                        defaultRecord.currentStatus = MATCH_TO_SEAT;
                    } else if (defaultRecord.STATUS == POSSIBLE_MATCH) {
                        defaultRecord.possibleBranding = Brand;
                        defaultRecord.currentStatus = POSSIBLE_MATCH_SEAT;
                    } else {
                        defaultRecord.currentStatus = NOT_MATCHED_SEAT
                    }
                    defaultRecords.push(defaultRecord);
                }
            })
        }
        this.defaultStudent = defaultRecords;
        this.studentList = studentRecords;
    }

    /** Function to update the match status */
    handleMatch(event) {
        let matchId = event.currentTarget.dataset.match;
        let matchStatus;
        if (event.currentTarget.label == MATCHED) {
            if (event.currentTarget.variant == Brand) {
                matchStatus = '';
            } else {
                matchStatus = MATCH;
            }
        } else if (event.currentTarget.label == POSSIBLE) {
            if (event.currentTarget.variant == Brand) {
                matchStatus = '';
            } else {
                matchStatus = POSSIBLE_MATCH;
            }
        }
        this.info = {
            selectedStudent: event.currentTarget.dataset.student,
            table: STUDENT
        };

        /**Function to call the apex which updates match status and to display the toast message */
        updateMatchStatus({ matchid: matchId, status: matchStatus })
            .then(result => {
                if (this.container == 'Lightning') {
                    const evt = new ShowToastEvent({
                        title: 'Success',
                        message: match_success,
                        variant: 'success',
                    });
                    this.dispatchEvent(evt);
                } else {
                    this.isMatchUpdated = true;
                    setTimeout(() => {
                        this.isMatchUpdated = false;

                    }, 3000);
                }
                this.updateRefresh();
            }).catch(error => {
                if (this.container == 'Lightning') {
                    const evt = new ShowToastEvent({
                        title: 'Failure',
                        message: error.body.message,
                        variant: 'error',
                    });
                    this.dispatchEvent(evt);
                } else {
                    this.errorMessage = error.body.message;
                    this.error = true;
                    
                    setTimeout(() => {
                        this.error = false;

                    }, 3000);
                }
            })
    }
    /** Event to update the details of table after status change is made from student table */
    updateRefresh() {
        const updatedEvent = new CustomEvent('update', {
            detail: this.info
        });
        this.dispatchEvent(updatedEvent);
    }
}