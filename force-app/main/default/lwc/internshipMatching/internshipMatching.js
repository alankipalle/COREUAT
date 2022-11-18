import { LightningElement, api } from 'lwc';
const STUDENT = 'student';
const SEAT = 'seat'
export default class InternshipMatching extends LightningElement {

    @api container = 'Lightning';
    studentId = '';
    seatId = '';
    matchId = '';
    matchDetailsStyle = 'slds-col slds-size_1-of-2';
    seatsStudentsStyle = 'slds-col slds-size_1-of-2 matchList';
    recordLists = 'slds-grid slds-gutters matchList';
    matchBy = SEAT;

    /** Provides us with options to match by seat or by student */
    get matchByOptions() {
        return [
            { label: 'Seat', value: SEAT },
            { label: 'Student', value: STUDENT },

        ];
    }

    /** On change function to handle whenever there is change in match by Seat or Student */
    handleMatchByChange(event) {
        this.matchBy = event.detail.value;
        if (this.matchBy == SEAT) {
            this.seatId = '';
            this.studentId = '';
            this.recordLists = 'slds-grid slds-gutters matchList';
        } else {
            this.studentId = '';
            this.seatId = '';
            this.recordLists = 'slds-grid slds-gutters matchList slds-grid_reverse';
        }
        setTimeout(() => {this.refreshViews();
        }, 1000);
    }

    /**  Event handler for student selection */
    handleSelected(event) {
        this.studentId = event.detail.studentId;
        if (this.matchBy == SEAT) {

            this.matchId = event.detail.matchId;
        }
        
       
    }

    /**  Event handler for seat selection */
    handleSelectedSeat(event) {
        this.seatId = event.detail.seatId;
        if (this.matchBy == STUDENT) {
            this.matchId = event.detail.matchId;
        }
       
    }

    /** Event handler to update selected seat and student when match status is changed */
     handleMatchUpdate(event) {
       
        if(event.detail.table == STUDENT && this.matchBy == SEAT){
               this.template.querySelector('c-unmatched-students').getCurrentStudentDetails(event.detail.selectedStudent);
               this.template.querySelector('c-open-seats').refreshMatchUpdate();
        }else if(event.detail.table == SEAT && this.matchBy == STUDENT){
             this.template.querySelector('c-unmatched-students').refreshMatchUpdate();
               this.template.querySelector('c-open-seats').getCurrentSeatDetails(event.detail.selectedSeat);
        }else if(event.detail.table == SEAT ){
            this.template.querySelector('c-open-seats').getCurrentSeatDetails(event.detail.selectedSeat);
            this.template.querySelector('c-unmatched-students').getCurrentStudentDetails(this.studentId);
        }else if(event.detail.table == STUDENT ){
            this.template.querySelector('c-open-seats').getCurrentSeatDetails(this.seatId);
            this.template.querySelector('c-unmatched-students').getCurrentStudentDetails(event.detail.selectedStudent);
        
        }
    
       
    }

    /** Funtion to refresh the student and seat cloumns*/
    refreshViews() {
        this.template.querySelector('c-unmatched-students').refreshStudents();
        this.template.querySelector('c-open-seats').refreshSeats();
    }

    /** Used to expand the Make a Match section */
    handleExpand(event) {
        this.matchDetailsStyle = 'slds-col slds-size_1-of-1';
        this.seatsStudentsStyle = 'hidden';
    }

    /** Used to contract the Make a Match section */
    handleContract(event) {
        this.matchDetailsStyle = 'slds-col slds-size_1-of-2';
        this.seatsStudentsStyle = 'slds-col slds-size_1-of-2 matchList';
    }
}