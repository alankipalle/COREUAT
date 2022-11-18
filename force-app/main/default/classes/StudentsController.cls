public with sharing class StudentsController {
    
    /** Function Called from Unmatched_students LWC to get students records as per match by status*/
    @AuraEnabled
     public static RecordsResult getUnmatchedStudents(String matchBy, String seatId, String queryTerm, List<String> trackFilter, List<String> marketFilter,String siteNameFilter,List<String> trackNameFilter,String communityNameFilter, String readinessNotesFilter,String addressFilter,String matchingGroupFilter,String matchingStatusFilter,Integer pageNumber, Integer pageSize){
         RecordsResult result = new RecordsResult();
         
             if(matchBy == matching_constants.student){
                 result = Student.getStudents(queryTerm, trackFilter, marketFilter,siteNameFilter,trackNameFilter,communityNameFilter,readinessNotesFilter,addressFilter,matchingGroupFilter,matchingStatusFilter,pageNumber, pageSize);
             }else if(matchBy == matching_constants.seat){
                 if(seatId != null && seatId != ''){
                     result = Student.getStudentsBySeat(seatId, queryTerm, trackFilter, marketFilter,siteNameFilter,trackNameFilter,communityNameFilter,readinessNotesFilter,addressFilter,matchingGroupFilter,matchingStatusFilter,pageNumber, pageSize);
                 }else{
                     result = null;
                 }
             }
         
         return result;
     }

     @AuraEnabled(cacheable = true)
     public static List<String> getStudentAddresses (String address){
     List<String> listOfAddresses = new List<String>();
     listOfAddresses = Student.getAddresses(address);
     return listOfAddresses;
     }
 
     @AuraEnabled(cacheable = true)
     public static List<String> getLearningCommunityNamesForStudents (String communityName){
     List<String> listOfCommunityNames = new List<String>();
     listOfCommunityNames = Student.getLearningCommunityNames(communityName);
     return listOfCommunityNames;
     }
 
     @AuraEnabled
     public static RecordsResult getSelectedStudent(String seatId, String studentId){
     RecordsResult result = new RecordsResult();
     result = Student.getSelectedStudentDetails(seatId,studentId);
     return result;
     }
 
     @AuraEnabled(cacheable=true)
     public static String getStudentName(String studentId) {
         String studentName;
         studentName = Student.getStudentName(studentId);
         return studentName;
     }
 
     @AuraEnabled
     public static RecordsResult getStudentDetails(String seatId, String studentId, Integer pageNumber, Integer pageSize) {
         RecordsResult result = new RecordsResult();
         result = Student.getStudentDetails(seatId,studentId,pageNumber,pageSize);
         return result;
     }

 }