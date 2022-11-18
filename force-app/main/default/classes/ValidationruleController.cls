public class ValidationruleController {  
        public class MetadataServiceExamplesException extends Exception { }

    private final String BASE_URL = URL.getSalesforceBaseUrl().toExternalForm();
    private static final String TOOLING_API_URI = '/services/data/v56.0/tooling/query/?q=Select+id,Active,Description,ValidationName,ErrorDisplayField,ErrorMessage+from+ValidationRule';    
   	private static final String TOOLING_META_API_URI = '/services/data/v56.0/tooling/query/?q=Select+id,Metadata+from+ValidationRule';    

   	@AuraEnabled(cacheable=true)
    public static String getValidationRules(String sObjectName){    
        
     	 String updatedName=sObjectName.removeEnd('__c');
        String conditions='+where+EntityDefinition.DeveloperName=\''+String.escapeSingleQuotes(updatedName)+'\'';
        HttpResponse res = calloutRequest('GET', '',conditions,'normal' );
       
        return res.getBody();
    } 
    
    @AuraEnabled(cacheable=true)
    public static String getValidationRuleMetadata(String ruleID){   
        String conditions='+where+Id=\''+String.escapeSingleQuotes(ruleID)+'\'';
        HttpResponse res = calloutRequest('GET', '',conditions,'metadata' );
      
        return res.getBody();
    } 
    
    private static HttpResponse calloutRequest(String method, String body, String conditions, String typeOfRequest ){
        HttpRequest req = new HttpRequest(); 
        String reqURL= '';
            if(typeOfRequest=='metadata')
                reqURL=TOOLING_META_API_URI+conditions;    
            else
                reqURL=TOOLING_API_URI+conditions;
        
        if(method=='POST') {
            req.setBody(body);
            reqURL+='?_HttpMethod=PATCH';
        }
       
        req.setHeader('Content-Type', 'application/json');      
        req.setEndpoint('callout:STAGING/'+reqURL);
        req.setMethod(method);
        req.setTimeout(120000);
        req.setHeader('Content-Length', '0');        
        
        return new Http().send(req);
    }
 
    @AuraEnabled (cacheable=true)
    public static List<Validation> retreieveValidationRules(String sobjectName){
        List<Validation> validationRules=new List<Validation>();
        validationRules = getvalidation(sobjectName);
      
        
        return validationRules;
    }

    
    public class Validation{
        @AuraEnabled
        public String name{get;set;}
          @AuraEnabled
        public String description{get;set;}
          @AuraEnabled
        public boolean active{get;set;}
          @AuraEnabled
        public String errorConditionFormula{get;set;}
          @AuraEnabled
        public String errorMessage{get;set;}
         @AuraEnabled
        public String sObjectName{get;set;}
        public Validation(String vName, String vdescription, Boolean vactive, String verrorConditionFormula, String verrorMessage,String vsObjectName){
            name=vName;
                description=vdescription;
                active=vactive;
                errorConditionFormula=verrorConditionFormula;
                errorMessage=verrorMessage;
                sObjectName=vsObjectName;
        }
      
    }
    
    @AuraEnabled (cacheable=true)
    public static List<EntityDefinition> retreieveObjects(){
        return [SELECT Id, MasterLabel,  
                    DeveloperName, 
                    QualifiedApiName 
                    FROM EntityDefinition 
                    WHERE IsApexTriggerable = true
                    ORDER BY MasterLabel];
    }
    
    public static List<Validation> getvalidation(String currentobj)
    {
        List<String> sob=currentobj.split(',');      
        List<Validation> vlist=new List<Validation>();
        
        MetadataService.MetadataPort service = createService();
        List<MetadataService.CustomObject> customObject =
            (List<MetadataService.CustomObject>) service.readMetadata('CustomObject',
                                                                      sob).getrecords();
       
        for(MetadataService.CustomObject field : customObject) {
            
            if(field.validationRules!=null){
                for(MetadataService.ValidationRule fie : field.validationRules) {                                    
                    vlist.add(new Validation(fie.fullName,fie.description,fie.active,fie.errorConditionFormula,fie.errorMessage,field.fullName));
                    
                }
            }
        }
        
       return vlist; 
    }
    @AuraEnabled
    public static String deleteValidationRules(String rules){
        List<String> validationRules=rules.split(',');
       
        MetadataService.MetadataPort service = createService();     
        List<MetadataService.DeleteResult> results =        
                service.deleteMetadata(
                    'ValidationRule', validationRules);
      
        handleDeleteResults(results[0]);
        
        return 'SUCCESS';
    }
    
     public static MetadataService.MetadataPort createService(){       
        refreshToken(); 
        MetadataService.MetadataPort mdapi = new MetadataService.MetadataPort();
        mdapi.endpoint_x = 'callout:STAGING/services/Soap/m/55.0';
        mdapi.SessionHeader = new MetadataService.SessionHeader_element();
        //mdapi.SessionHeader.sessionId = UserInfo.getSessionId();
        mdapi.SessionHeader.sessionId = '{!$Credential.OAuthToken}';
        mdapi.timeout_x=120000;
        
        return mdapi;
    }
    
    /**
     * Example helper method to interpret a SaveResult, throws an exception if errors are found
     **/
    public static void handleDeleteResults(MetadataService.DeleteResult deleteResult)
    {
        // Nothing to see?
        if(deleteResult==null || deleteResult.success)
            return;
        // Construct error message and throw an exception
        if(deleteResult.errors!=null)
        {
            List<String> messages = new List<String>();
            messages.add(
                (deleteResult.errors.size()==1 ? 'Error ' : 'Errors ') +
                    'occured processing component ' + deleteResult.fullName + '.');
            for(MetadataService.Error error : deleteResult.errors)
                messages.add(
                    error.message + ' (' + error.statusCode + ').' +
                    ( error.fields!=null && error.fields.size()>0 ?
                        ' Fields ' + String.join(error.fields, ',') + '.' : '' ) );
            if(messages.size()>0)
                throw new MetadataServiceExamplesException(String.join(messages, ' '));
        }
        if(!deleteResult.success)
            throw new MetadataServiceExamplesException('Request failed with no specified error.');
    }
    
    /*public static list < String > readCustomObjectSync(String objectName) {

    //Creating a Service for Callout
    MetadataService.MetadataPort metadataConnection = createService();

    //Checking for namespace
    MetadataService.DescribeMetadataResult describeRes = metadataConnection.describeMetadata('36.0');
    if(describeRes!=null){
        List<MetadataService.DescribeMetadataObject> objectList = describeRes.MetadataObjects;
        String namespace = describeRes.organizationNamespace;

        if(objectName.contains('__c')) {
            if(namespace != null && namespace !='') {
                objectName=namespace+'__'+objectName;
            }
        }
    }

    List <String> objectNames = new List <String>();
    objectNames.add(objectName);

    List <String> fieldName = new List <String>();

    try {
        MetadataService.IReadResult readResult = metadataConnection.readMetadata('CustomObject', objectNames);
        MetadataService.Metadata[] mdInfo = readResult.getRecords();
        System.debug('Number of component info returned: '
                     + mdInfo);
        for (MetadataService.Metadata md : mdInfo) {
            if (md != null) {
                MetadataService.CustomObject obj = (MetadataService.CustomObject) md;
                System.debug('Custom object full name: '+ obj);
                if(obj.fields != null) {
                    for(MetadataService.CustomField field : obj.fields) {
                        if(field != null) {
                            fieldName.add(field.fullName);
                            System.debug('Field Name: ' + field.fullName);
                        }
                    }
                }
            } else {
                System.debug('Empty metadata.');
            }
        }
    } catch (Exception ce) {
        System.debug('exception ' + ce.getMessage());
    }

    return fieldName;
}*/
    @AuraEnabled(cacheable=true)
    public static void getObjectInfo(String objectName){
        System.debug('objectName: '+objectName);
            MetadataService.MetadataPort service = createService();

        MetadataService.CustomObject customObject = (MetadataService.CustomObject) 
    service.readMetadata('CustomObject', new String[] { objectName }).getRecords()[0];
        
        System.debug('Object Info: ');
        
         if(customObject.fields != null) {
                    for(MetadataService.CustomField field :customObject.fields) {
                       System.debug(field);
                    }
                }
    }

    
    public static void refreshToken(){
         Http h = new Http();
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:STAGING/services/Soap/m/55.0');
        req.setMethod('GET');
        HttpResponse res = h.send(req);
    }
}