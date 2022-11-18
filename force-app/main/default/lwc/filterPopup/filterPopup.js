import { LightningElement, api, wire, track } from 'lwc';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import IWS_OBJECT from '@salesforce/schema/Internship_Work_Site__c';
import ENG_OBJECT from '@salesforce/schema/Engagement__c';
import TRACK_FIELD from '@salesforce/schema/Internship_Work_Site__c.TrackFamily__c';
import SPECIALTY_FIELD from '@salesforce/schema/Internship_Work_Site__c.Specialty__c';
import STAGE_FIELD from '@salesforce/schema/Internship_Work_Site__c.Stage__c';
import COHORT_FIELD from '@salesforce/schema/Engagement__c.Cohort__c';
import SITE_FIELD from '@salesforce/schema/Engagement__c.Site__c';
import getSites from '@salesforce/apex/iwsManager.getSites';
import fetchSearchData from '@salesforce/apex/iwsManager.fetchSearchData';

export default class FilterPopup extends LightningElement {

    isVisible;
    filters = { searchKey: '' };
    cohortPicklistvalues;
    sitePicklistvalues;
    trackPicklistValues;
    specialtyPicklistValues;
    stagePicklistValues;
    brandedNamePicklistValues = [];
    selectedCohortValueList = [];
    selectedSiteValueList = [];
    selectedTrackValueList = [];
    selectedSpecialtyValueList = [];
    selectedStageValueList = [];
    selectedBrandedNameList = [];
    header = 'Filters:'
    accountID = '';
    userID = '';
    error;
    titleFields = 'Name';
    accsearchKey = '';
    usersearchKey = '';
    accFields = 'Name';
    subTitleFields = 'Industry';
    userFields = 'Name';
    usersubTitleFields = 'Email';
    usersObjectName = 'User';
    accsObjectName = 'Account';
    filter = 'Profile.Name NOT IN(\'Custom Customer Community Login User\',\'Customer Community Login User\')';

    @api
    show(element) {
        this.isVisible = true;
    }

    handleClose() {
        this.isVisible = false;
    }


    // wire function property to fetch search record based on user input
    @wire(fetchSearchData, { searchTerm: '$usersearchKey', fields: '$usersubTitleFields', sObjectName: '$usersObjectName', filter: '$filter' })
    usersearchResult;

    // wire function property to fetch search record based on user input
    @wire(fetchSearchData, { searchTerm: '$accsearchKey', fields: '$subTitleFields', sObjectName: '$accsObjectName', recordTypeName: 'Organization' })
    accsearchResult;

    @wire(getObjectInfo, { objectApiName: ENG_OBJECT })
    engMetadata;
    @wire(getObjectInfo, { objectApiName: IWS_OBJECT })
    iwsMetadata;

    @wire(getPicklistValues, { recordTypeId: '$engMetadata.data.defaultRecordTypeId', fieldApiName: COHORT_FIELD })
    cohortPicklist({ data, error }) {
        if (data) {
            let cohortOptions = [];
            const optionsValues = data.values;

            for (let i = 0; i < optionsValues.length; i++) {
                cohortOptions.push({
                    label: optionsValues[i].value,
                    value: optionsValues[i].value,
                })
            }
            cohortOptions.reverse();
            this.cohortPicklistvalues = cohortOptions;

        }
        if (error) {
            console.log(JSON.stringify(error));
        }
    };

    @wire(getPicklistValues, { recordTypeId: '$engMetadata.data.defaultRecordTypeId', fieldApiName: SITE_FIELD })
    sitePicklist({ data, error }) {
        if (data) {
            this.sitePicklistvalues = data.values;
        }
        if (error) {
            console.log(JSON.stringify(error));
        }
    };

    @wire(getPicklistValues, { recordTypeId: '$iwsMetadata.data.defaultRecordTypeId', fieldApiName: STAGE_FIELD })
    stagePicklist({ data, error }) {
        if (data) {
            this.stagePicklistValues = data.values;
        }
        if (error) {
            console.log(JSON.stringify(error));
        }
    };

    @wire(getPicklistValues, { recordTypeId: '$iwsMetadata.data.defaultRecordTypeId', fieldApiName: TRACK_FIELD })
    trackPicklist({ data, error }) {
        if (data) {
            this.trackPicklistValues = data.values;
        }
        if (error) {
            console.log(JSON.stringify(error));
        }
    };

    @wire(getPicklistValues, { recordTypeId: '$iwsMetadata.data.defaultRecordTypeId', fieldApiName: SPECIALTY_FIELD })
    specialtyPicklist({ data, error }) {
        if (data) {
            this.specialtyPicklistValues = data.values;
        }
        if (error) {
            console.log(JSON.stringify(error));
        }
    };

    @wire(getSites)
    wiredSitesData({ error, data }) {
        if (data) {
            for (let i = 0; i < data.length; i++) {
                if (data[i].Branded_Site_Name__c) {
                    let obj = { value: data[i].Id, label: data[i].Branded_Site_Name__c };
                    this.brandedNamePicklistValues.push(obj);
                }
            }
        } else {
            this.error = error;
            console.log(error);
        }
    }

    searchHandler(event) {
        const searchKey = event.detail;
        switch (event.target.name) {
            case "user":
                this.usersearchKey = searchKey;
                break;
            case "partner":
                this.accsearchKey = searchKey;
                break;
            default:
        }
    }

    lookupRecord(event) {
        const record = event.detail.selectedRecord;
        switch (event.target.name) {
            case "user":
                this.userID = record?.Id;
                this.filters['userID'] = this.userID;
                break;
            case "partner":
                this.accountID = record?.Id;
                this.filters['accountID'] = this.accountID;
                break;
            default:
        }
    }

    handleSubmit(event) {

        // Creates the event with the contact ID data.
        const selectedEvent = new CustomEvent('filters', { detail: this.filters });

        // Dispatches the event.
        this.dispatchEvent(selectedEvent);
    }

    //for multiselect picklist
    handleSelectOptionList(event) {
        var componentName = event.target.name;
        var componentValue = event.detail;
        this.filters[componentName] = componentValue;

        switch (componentName) {
            case "track":
                this.selectedTrackValueList = componentValue;
                break;
            case "specialty":
                this.selectedSpecialtyValueList = componentValue;
                break;
            case "cohort":
                this.selectedCohortValueList = componentValue;
                break;
            case "stage":
                this.selectedStageValueList = componentValue;
                break;
            case "site":
                this.selectedSiteValueList = componentValue;
                break;
            case "brandsite":
                this.selectedBrandedNameList = componentValue;
                break;
            default:
        }

    }

    handleClearAll() {
        setTimeout(() => {
            const picklists = this.template.querySelectorAll('c-multi-select-picklist');
            for (let i = 0; i < picklists.length; i++) {
                picklists[i].clearSelectedValues();
            }
            const lookups = this.template.querySelectorAll('c-yu-custom-lookup');
            for (let i = 0; i < lookups.length; i++) {
                lookups[i].clearvalues();
            }
        });

        this.brandedNamePicklistValues = [];
        this.selectedCohortValueList = [];
        this.selectedSiteValueList = [];
        this.selectedTrackValueList = [];
        this.selectedSpecialtyValueList = [];
        this.selectedStageValueList = [];
        this.selectedBrandedNameList = [];
        this.accountID = '';
        this.userID = '';
    }

}