import { LightningElement, api } from 'lwc';
import NO_CAR_ICON from '@salesforce/resourceUrl/NoCarIcon';
import MATCH_BANNER from '@salesforce/resourceUrl/MatchRibbonInternshipMatching';
import POSSIBLEMATCH_BANNER from '@salesforce/resourceUrl/PossibleMatchRibbonInternshipMatching';

const SELECTED_CARD = "selected";
const STUDENT_TEXT_SELECTED = 'SelectedStudent';
const STUDENT = 'student';
const SEAT = 'seat';

export default class StudentCard extends LightningElement{
    @api student;
    @api studentId ;
    @api matchBy;
    @api flag;
    nocarIcon = NO_CAR_ICON;
    match_banner = MATCH_BANNER;
    possiblematch_banner = POSSIBLEMATCH_BANNER;

    //method is called when clicked on the student card in the UI to fetch student and match Ids
    handleClick() {
        const selectedEvent = new CustomEvent('selected', {
            detail: {
                studentId: this.student.studentId,
                matchId: this.student.matchId
            }
        });
        this.dispatchEvent(selectedEvent);
    }
   
    //used to get the blue bordering on selecting the card
    get selectedCard() {
        return (this.student.studentId == this.studentId) ? SELECTED_CARD : '';
    }

    //function is used to check whether the image of the student is available or not. If avaialble returns the student image or it will return the standard people icon
    get studentLink() {
        var imageCheck;
        if(this.student.imageLink == null || this.student.imageLink == ''){
            imageCheck = false;
        }
        else if(this.student.imageLink != null || this.student.imageLink != ''){
            imageCheck = true;
        }
        return imageCheck;
    }

    //function used to check whether the student has car or not. If the student has the car, then the car icon is shown else no car icon is shown
    get hasCar(){
        var hasACarValue;
        if(this.student.hasACar == 'Yes'){
            hasACarValue = true;
        }
        else{
            hasACarValue = false;
        }
        return hasACarValue;
    }

    //function used to check whether the student can be matched or not. If yes, then it returns match banner
    get matchStatus(){
        var matched;
         if(this.student.potentialMatch > 0){
            matched = true
        } 
        return matched;
    }

    //function used to check whether the student is a possible match or not. If yes, then it returns possible match banner
    get potentialMatchStatus(){
        var possibleMatch;
        if(this.student.possibleMatch > 0 && this.student.potentialMatch == 0){
            possibleMatch = true
        }
        return possibleMatch;
    }

    //used to return the text if the student has possible seat matched to him
    get matchPossibleStatus(){
        var matchPossibleStatus;
        if((this.student.matchStatus == 'Possible Match') && this.matchBy == SEAT){
            matchPossibleStatus = true;
        }
        return matchPossibleStatus;
    }

    //used to return the text if the student has seat matched to him
    get matchStatusText(){
        var matchStatusText;
        if((this.student.matchStatus == 'Match') && this.matchBy == SEAT){
            matchStatusText = true;
        }
        return matchStatusText;
    }

    //used to display the text on the student card ('student selected') on the card when selected
    get studentSelectedText() {
        return (this.student.studentId != this.studentId) ? STUDENT_TEXT_SELECTED : '';
    }

    //function returns the value when the match by is student
    get matchByType(){
        var matchByValue;
        if(this.matchBy == STUDENT){
            matchByValue = true;
        }
        return matchByValue;
    }

}