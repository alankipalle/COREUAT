/**
* @description       : This class is used for OrgStructureCmp lightning web component
* @author            : alankipalle@yearup.org
* @group             : CE
* @last modified on  : 09-01-2022
* @last modified by  : alankipalle@yearup.org
**/
public with sharing class OrgStructureRecordController {
    @testVisible
    private static Boolean throwException = false;
    
    // Get All Org structure records in the Account hierarchy
    @AuraEnabled(cacheable = true)
    public static list<Org_Structure__c> getOrgStructureRecords(Id parentId, Id accountId){      
        
        Map<Id,Account> allAccounts=new Map<Id,Account>();
        if(parentId!=null){
            allAccounts.putAll(new Map<Id,Account>([SELECT ID,Name FROM Account WHERE 
                                                    (ParentID =:parentId OR Id =:parentId) 
                                                   ]));               
        }
        
        if(accountId!=null){
            allAccounts.putAll(new Map<Id,Account>([SELECT ID,Name FROM Account WHERE 
                                                    (Id =:accountId OR ParentID =:accountId)
                                                   ]));                
        }  
        
        System.debug('allAccounts: '+allAccounts);
        
        return [SELECT Id, Name,Business_Unit__c,Inactive__c,Division__c,Account__c,Line_of_Business__c,Account__r.Name FROM Org_Structure__c where Account__c IN:allAccounts.keySet() ORDER BY LastModifiedDate];
        
    }
    
    // Get All Org structure records for specific account
    @AuraEnabled(cacheable = true)
    public static list<Org_Structure__c> getOrgStructureRecordsByAccount(Id accountId){       
        return [SELECT Id, Name,Business_Unit__c,Inactive__c,Division__c,Account__c,Line_of_Business__c,Account__r.Name FROM Org_Structure__c where  Account__c =:accountId ORDER BY LastModifiedDate];              
        
    }
    
    // Get All Org structure records along with IWS and Contact records	
    @AuraEnabled(cacheable = true)
    public static list<OrgWrapper> getOrgRecordsWithConsIws(Id accountId){
        
        list<OrgWrapper> recordList = new List<OrgWrapper>();
        Map<Id, List<Contact>> contacts=new Map<Id,List<Contact>>();
        Map<Id, List<Internship_Work_Site__c>> iwsRecords=new Map<Id, List<Internship_Work_Site__c>>();
        
        Map<Id,Org_Structure__c> orgMap=new Map<Id,Org_Structure__c>(
            [   
                SELECT      Id, Name,Business_Unit__c,Inactive__c,Division__c,Account__c,Line_of_Business__c,Account__r.Name 
                FROM        Org_Structure__c where  Account__c =:accountId 
                ORDER BY    LastModifiedDate    
            ]);        
        
        for(Contact contact: [SELECT Id,LastName, Org_Structure__c FROM Contact where Org_Structure__c IN:orgMap.keySet()]){
            if(contacts.containsKey(contact.Org_Structure__c)){
                contacts.get(contact.Org_Structure__c).add(contact);
            }else{
                contacts.put(contact.Org_Structure__c, new List<Contact>{contact});
            }                
        }
        
        for(Internship_Work_Site__c iws: [SELECT Id,Name, Org_Structure__c FROM Internship_Work_Site__c where Org_Structure__c IN:orgMap.keySet()]){
            if(iwsRecords.containsKey(iws.Org_Structure__c)){
                iwsRecords.get(iws.Org_Structure__c).add(iws);
            }else{
                iwsRecords.put(iws.Org_Structure__c, new List<Internship_Work_Site__c>{iws});
            }                
        }
        
        for(Org_Structure__c org: orgMap.values()) {
            OrgWrapper wrapper=new OrgWrapper();
            wrapper.orgRecord = org;
            List<sObject> records=new List<sObject>();
            
            if(contacts.containsKey(org.id)) {
                records.addAll( contacts.get(org.Id));
            }
            if(iwsRecords.containsKey(org.id)) {                    
                records.addAll( iwsRecords.get(org.Id));
            }
            
            wrapper.items=records;
            
            recordList.add(wrapper);
        }
        
        return recordList;
    }
    
    public Class OrgWrapper{
        @AuraEnabled
        public Org_Structure__c orgRecord {get;set;}        
        @AuraEnabled
        public List<sObject> items {get;set;}
    } 
}