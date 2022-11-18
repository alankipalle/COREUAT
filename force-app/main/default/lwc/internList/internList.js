import { LightningElement, api } from 'lwc';

export default class InternList extends LightningElement {
    @api internList;
    @api targetIWSId;


    //Getter indicates if any items in the list
    get areInterns() {
        if (this.internList) {
            console.log('interns avaialbel')
            return this.internList.length > 0;
        } else {
            return false;
        }
    }

    handleSelect(event) {

        const record = event.detail;
        this.records.forEach((element, index) => {
            if (element.Id === record.Id) {
                if (element.selected) {
                    element.selected = false;
                } else {
                    element.selected = true;
                }
                this.selectedIds.push(element.Id);
            }
        });

    }

}