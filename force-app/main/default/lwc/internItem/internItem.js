import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class InternItem extends LightningElement {
    @api record;
    @api selected = false;
    itemClass = '';
    handleClick(event) {
        if (this.record.billingNumber !== null && this.record.billingNumber !== undefined) {
            return this._showToast(this, 'This Internship is in billing, you cannot move', 'Internship is in Billing', 'error');
        }
        const selectEvent = new CustomEvent('select', {
            detail: this.record
        });
        // Fire the custom event
        this.dispatchEvent(selectEvent);
    }

    // Set the background color class if this attribute is true.
    get selectedClass() {
        return this.selected ? 'slds-box slds-box_small slds-box slds-theme_alt-inverse' : 'slds-box slds-box_small slds-box background'; // you can use your custom class here.
    }

    get recordString() {
        return JSON.stringify(this.record)
    }

    get statusIcon() {
        return this.record.billingNumber !== null && this.record.billingNumber !== undefined ? 'action:close' : 'action:approval'
    }

    //Notification utility function
    _showToast = (firingComponent, toastTitle, toastBody, variant) => {
        const evt = new ShowToastEvent({
            title: toastTitle,
            message: toastBody,
            variant: variant
        });
        firingComponent.dispatchEvent(evt);
    }
}