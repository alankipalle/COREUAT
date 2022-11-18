/********************
Class Name: Student
Description : Has methods which returns the student records.
*********************/

public with sharing class Student {
    public static final String fileURL='/sfc/servlet.shepherd/document/download/';
    public static final String attachmentURL='/servlet/servlet.FileDownload?file=';
    //This method used to fetch the student records after applying the search and filters
    public static RecordsResult getStudents(String queryTerm, List<String> trackFilter, List<String> marketFilter,String siteNameFilter,List<String> trackNameFilter,String communityNameFilter, String readinessNotesFilter,String addressFilter,String matchingGroupFilter,String matchingStatusFilter,Integer pageNumber, Integer pageSize){
        String query = 'SELECT Id,Number_of_Not_Match__c,Engagement_Status__c,CurrentCohort__c ,Name,Potential_Match__c,Number_of_Possible_Matches__c,Photo_URL__c,Address__c, Student_Name__c, Track_Family_Name__c, Internship_Readiness_Rating__c, Can_Drive_to_Internship__c,Site_Name__c,Matching_Group__c,Learning_Community_Name__c  FROM MATCH_Matching_Student__c where  Number_of_Matches__c >0 and Engagement_Status__c = \'Enrolled\' and CurrentCohort__c  = true AND Id IN (Select Matching_Student__c FROM MATCH_Matching_Match__c WHERE Is_Valid__c  = true)';
        String countQuery = 'SELECT count() from MATCH_Matching_Student__c where  Number_of_Matches__c >0 and Engagement_Status__c = \'Enrolled\' and CurrentCohort__c = true AND Id IN (Select Matching_Student__c FROM MATCH_Matching_Match__c WHERE Is_Valid__c  = true)';
        String filter = '';
        Set<id> stuId = new Set<id>();
         if(queryTerm != null && queryTerm != ''){
             queryTerm = queryTerm.replaceAll('[^a-zA-Z0-9\\s+]', '');
             String queryIds = 'FIND {*' + queryTerm + '*} IN ALL FIELDS RETURNING MATCH_Matching_Student__c(ID)';
             List<List<sObject>> studentIds = search.query(queryIds);
             
             if(!studentIds.isEmpty() && studentIds != null){
                 for(sobject std : studentIds[0]){
                     stuId.add(std.id); 
                 }
             }
             if(stuId.isEmpty()){
                 filter += ' AND id = null';
             }
          }
        
        if(siteNameFilter != '' && siteNameFilter != null){
            filter += ' AND Site_Name__c  =: siteNameFilter ';   
        }

        if(matchingGroupFilter != '' && matchingGroupFilter != null){
            filter += ' AND Matching_Group__c  =: matchingGroupFilter ';   
        }
            
        //if(trackNameFilter != '' && trackNameFilter != null){
        if(!trackNameFilter.isEmpty()){
            filter += ' AND Track_Family_Name__c  =: trackNameFilter ';   
        }
        
        if(addressFilter != ''){
            String queryIds = 'FIND {*' + addressFilter + '*} IN ALL FIELDS RETURNING MATCH_Matching_Student__c(ID)';
            List<List<sObject>> studentIds = search.query(queryIds);
            for(sobject std : studentIds[0]){
                stuId.add(std.id); 
            }
        }

        if(!stuId.isEmpty()){
            filter += ' AND ID in : stuId ';
        }
        
        if(communityNameFilter != '' && communityNameFilter != null){
            String searchWord = '%'+ communityNameFilter+ '%';
            filter += ' AND Learning_Community_Name__c  LIKE :searchWord';   
        }
        
        if(readinessNotesFilter != '' && readinessNotesFilter != null){
            filter += ' AND Internship_Readiness_Rating__c  =: readinessNotesFilter ';   
        }

        if(matchingStatusFilter != '' && matchingStatusFilter != null){
            
            if(matchingStatusFilter == matching_constants.match){
                filter += ' AND Potential_Match__c  > 0';
            }
            else if(matchingStatusFilter == matching_constants.match_status){
                filter += ' AND Number_of_Possible_Matches__c  > 0 AND Potential_Match__c = 0';
            }
            else if(matchingStatusFilter == matching_constants.notMatch){
                filter += ' AND Number_of_Not_Match__c  > 0';
            }
            else if(matchingStatusFilter == matching_constants.unMatch){
                filter += ' AND Potential_Match__c  = 0 AND Number_of_Possible_Matches__c  = 0 AND Number_of_Not_Match__c  = 0 ';
            }
        }
       
        query += filter;
        countQuery += filter;
		Integer offset = (pageNumber - 1) * pageSize;
        query += ' ORDER BY Name LIMIT :pageSize OFFSET :offset';
        List<MATCH_Matching_Student__c> students = Database.query(query);
		RecordsResult result = new RecordsResult();
        result.records = wrapStudents(students);
        result.totalRecords = Database.countQuery(countQuery);
		return result;
    }

    //This method returns student records when matched by seat after applying filters or adding the search data
    public static RecordsResult getStudentsBySeat(String seatId, String queryTerm, List<String> trackFilter, List<String> marketFilter,String siteNameFilter,List<String> trackNameFilter,String communityNameFilter, String readinessNotesFilter,String addressFilter,String matchingGroupFilter,String matchingStatusFilter, Integer pageNumber, Integer pageSize){
        RecordsResult result = new RecordsResult();
        String query = 'Select Id,Matching_Student__r.Number_of_Not_Match__c,Matching_Student__r.CurrentCohort__c,Matching_Student__r.Engagement_Status__c,Matching_Student__r.Photo_URL__c,Matching_Student__r.Number_of_Possible_Matches__c,Matching_Student__r.Potential_Match__c, Matching_Student__c, Matching_Student__r.Student_Name__c, Matching_Student__r.Track_Family_Name__c, Matching_Student__r.Internship_Readiness_Rating__c,Matching_Student__r.Matching_Group__c, Matching_Student__r.Can_Drive_to_Internship__c,Matching_Student__r.Site_Name__c, matching_student__r.Learning_Community_Name__c, Matching_Student__r.Address__c,Match_Status__c FROM MATCH_Matching_Match__c where Matching_Seat__c =: seatId and Matching_Student__r.Number_of_Matches__c > 0  and Matching_Student__r.CurrentCohort__c = true AND Is_Valid__c  = true ';
        String countQuery = 'Select count() from MATCH_Matching_Match__c where Matching_Seat__c =: seatId and Matching_Student__r.Number_of_Matches__c > 0  and Matching_Student__r.CurrentCohort__c = true  AND Is_Valid__c  = true';
        Set<id> stuId = new Set<id>();
        String filter = '';
        if(queryTerm != null && queryTerm != ''){
            queryTerm = queryTerm.replaceAll('[^a-zA-Z0-9\\s+]', '');
             String queryIds = 'FIND {*' + queryTerm + '*} IN ALL FIELDS RETURNING MATCH_Matching_Student__c(ID)';
             List<List<sObject>> studentIds = search.query(queryIds);
             if(!studentIds.isEmpty() && studentIds != null){
                 for(sobject std : studentIds[0]){
                    stuId.add(std.id); 
                 }
             }if(stuId.isEmpty()){
                 filter += ' AND id = null';
             }
        }
        if(siteNameFilter != '' && siteNameFilter != null){
            filter += ' AND Matching_Student__r.Site_Name__c  =: siteNameFilter ';   
        }

        if(matchingGroupFilter != '' && matchingGroupFilter != null){
            filter += ' AND Matching_Student__r.Matching_Group__c  =: matchingGroupFilter ';   
        }
            
        //if(trackNameFilter != '' && trackNameFilter != null){
        if(!trackNameFilter.isEmpty()){
            filter += ' AND Matching_Student__r.Track_Family_Name__c  =: trackNameFilter ';   
        }

        if(addressFilter != ''){
            String queryIds = 'FIND {*' + addressFilter + '*} IN ALL FIELDS RETURNING MATCH_Matching_Student__c(ID)';
            List<List<sObject>> studentIds = search.query(queryIds);
            for(sobject std : studentIds[0]){
                stuId.add(std.id); 
             }
        }
        if(!stuId.isEmpty()){
            filter += ' AND Matching_Student__r.ID in : stuId ';
        }
        
        if(communityNameFilter != '' && communityNameFilter != null){
            String searchWord = '%'+ communityNameFilter+ '%';
            filter += ' AND matching_student__r.Learning_Community_Name__c  LIKE :searchWord';   
        }

        if(matchingStatusFilter != '' && matchingStatusFilter != null){
            if(matchingStatusFilter == matching_constants.match ){
                filter += ' AND matching_student__r.Potential_Match__c  > 0';
            }
            else if(matchingStatusFilter == matching_constants.match_status){
                filter += ' AND matching_student__r.Number_of_Possible_Matches__c  > 0 AND matching_student__r.Potential_Match__c = 0';
            }
            else if(matchingStatusFilter == matching_constants.notMatch){
                filter += ' AND matching_student__r.Number_of_Not_Match__c  > 0';
            }
            else if(matchingStatusFilter == matching_constants.unMatch){
                filter += ' AND matching_student__r.Potential_Match__c  = 0 AND matching_student__r.Number_of_Possible_Matches__c  = 0 AND matching_student__r.Number_of_Not_Match__c  = 0 ';
            }
        }
        
        if(readinessNotesFilter != '' && readinessNotesFilter != null){
            filter += ' AND Matching_Student__r.Internship_Readiness_Rating__c  =: readinessNotesFilter ';   
        }
		 query += filter;
         countQuery += filter;

        Integer offset = (pageNumber - 1) * pageSize;
        query += '  ORDER BY Match_Status__c DESC NULLS LAST,Matching_Student__r.Student_Name__c LIMIT :pageSize OFFSET :offset';
        List<MATCH_Matching_Match__c> matches = Database.query(query);
        Set<Id> studentIds = new Set<Id>();
        for(MATCH_Matching_Match__c match : matches){
            studentIds.add(match.Matching_Student__c);
        }
        result.records = wrapMatches(matches);
        result.totalRecords = Database.countQuery(countQuery);
        return result;
    }

    //This method is used in lwc component which fetches the student details which is selected
    public static RecordsResult getSelectedStudentDetails(String seatId, String studentId){
        RecordsResult result = new RecordsResult();
        String query = 'Select Id,Matching_Student__r.Number_of_Possible_Matches__c,Matching_Student__r.Potential_Match__c,Matching_Student__r.Id,Matching_Student__r.Student_Name__c,Matching_Student__r.Track_Family_Name__c,Matching_Student__r.Photo_URL__c,Match_Status__c FROM MATCH_Matching_Match__c where Matching_Seat__c =: seatId and Matching_Student__c=: studentId ';
        List<MATCH_Matching_Match__c> matches = Database.query(query);
        result.records = wrapCurrentStudent(matches);
        return result;
    }
    
    //This is a wrapper method used in getstudents method which has a collection of students
    public static List<StudentWrapper> wrapCurrentStudent(List<MATCH_Matching_Match__c> matches){
        List<StudentWrapper> wrappedStudents = new List<StudentWrapper>();
        for(MATCH_Matching_Match__c match : matches){
           
            StudentWrapper wrap = new StudentWrapper();
            wrap.matchId = match.Id;
            wrap.studentId = match.Matching_Student__r.Id;
            wrap.name = match.Matching_Student__r.Student_Name__c;
            wrap.trackFamilyName = match.Matching_Student__r.Track_Family_Name__c;
           	wrap.imageLink = photoURL(match.Matching_Student__r.Photo_URL__c);
           	wrap.potentialMatch = match.Matching_Student__r.Potential_Match__c;
            wrap.possibleMatch = match.Matching_Student__r.Number_of_Possible_Matches__c;
            wrap.matchStatus = match.Match_Status__c;
            wrappedStudents.add(wrap);
        }
        return wrappedStudents;
    }

    private static String photoURL(String photoID){
        String photoURL='';
        if( String.isNotBlank(photoID)){
            photoURL= photoID.startsWith('00P') ? attachmentURL+photoID : fileURL+photoID;
        }

        return photoURL;
    }
   
    //This is a wrapper method used in getStudentsBySeat method which has a collection of students based on the match done by seat
    public static List<StudentWrapper> wrapMatches(List<MATCH_Matching_Match__c> matches){
        List<StudentWrapper> wrappedStudents = new List<StudentWrapper>();
        for(MATCH_Matching_Match__c match : matches){
            StudentWrapper wrap = new StudentWrapper();
            wrap.matchId = match.Id;
            wrap.studentId = match.Matching_Student__r.Id;
            wrap.name = match.Matching_Student__r.Student_Name__c;
            wrap.trackFamilyName = match.Matching_Student__r.Track_Family_Name__c;
            wrap.internReadinessRating = match.Matching_Student__r.Internship_Readiness_Rating__c;
            wrap.hasACar = match.Matching_Student__r.Can_Drive_to_Internship__c;
            wrap.imageLink = photoURL(match.Matching_Student__r.Photo_URL__c);
            wrap.potentialMatch = match.Matching_Student__r.Potential_Match__c;
            wrap.possibleMatch = match.Matching_Student__r.Number_of_Possible_Matches__c;
            wrap.matchStatus = match.Match_Status__c;
            wrappedStudents.add(wrap);
        }
        return wrappedStudents;
    }
    
    public static List<StudentWrapper> wrapStudentList(List<MATCH_Matching_Match__c> matches){
        List<StudentWrapper> wrappedStudents = new List<StudentWrapper>();
        for(MATCH_Matching_Match__c match : matches){
            StudentWrapper wrap = new StudentWrapper();
            wrap.matchId = match.Id;
            wrap.studentId = match.Matching_Student__r.Id;
            wrap.name = match.Matching_Student__r.Student_Name__c;
            wrap.trackFamilyName = match.Matching_Student__r.Track_Family_Name__c;
            wrap.imageLink = photoURL(match.Matching_Student__r.Photo_URL__c);
           	wrap.matchStatus = match.Match_Status__c;
            wrappedStudents.add(wrap);
        }
        return wrappedStudents;
    }
   
    public static List<StudentWrapper> wrapStudents(List<MATCH_Matching_Student__c> students){
        List<StudentWrapper> wrappedStudents = new List<StudentWrapper>();
        for(MATCH_Matching_Student__c con : students){
            StudentWrapper wrap = new StudentWrapper();
            wrap.studentId = con.Id;
            wrap.name = con.Student_Name__c;
            wrap.trackFamilyName = con.Track_Family_Name__c;
            wrap.internReadinessRating = con.Internship_Readiness_Rating__c;
            wrap.hasACar = con.Can_Drive_to_Internship__c;
            wrap.imageLink = photoURL(con.Photo_URL__c);
            wrap.potentialMatch = con.Potential_Match__c;
            wrap.possibleMatch = con.Number_of_Possible_Matches__c;
            wrappedStudents.add(wrap);
            
        }
        return wrappedStudents;
    }

    /** Function to get student details to display in student table*/
    public static RecordsResult getStudentDetails(String seatId, String studentId, Integer pageNumber, Integer pageSize) {
        RecordsResult result = new RecordsResult();
        List<MATCH_Matching_Match__c> studentList = [Select Matching_Student__r.id FROM MATCH_Matching_Match__c
                where Matching_Seat__c =: seatId and Match_Status__c != null and Match_Status__c !=: matching_constants.notMatch order by Match_Status__c DESC
               ];
        Set<Id> studentIds = new Set<Id>();
        for(MATCH_Matching_Match__c ids: studentList){
            studentIds.add(ids.Matching_Student__r.id);
        }
        if(studentId !=null){
            studentIds.add(studentId);
        }
        Integer offset = (pageNumber - 1) * pageSize;
        String studentLists = 'Select Id , Matching_Student__r.Id,Matching_Student__r.Student_Name__c, Matching_Student__r.Track_Family_Name__c,Match_Status__c,Matching_Student__r.Photo_URL__c '+
                			  'FROM MATCH_Matching_Match__c '+
                			  'where Matching_Student__r.Id IN : studentIds  and Matching_Seat__c =: seatId and Matching_Student__r.Engagement_Status__c = \'Enrolled\' and Matching_Student__r.CurrentCohort__c = true AND Is_Valid__c  = true '+
                        	  'LIMIT :pageSize OFFSET :offset';
        List<MATCH_Matching_Match__c> matches = Database.query(studentLists);
        result.records = wrapStudentList(matches);
        String countQuery = 'Select count() FROM MATCH_Matching_Match__c where Matching_Student__r.Id IN : studentIds  and Matching_Seat__c =: seatId and Matching_Student__r.Engagement_Status__c = \'Enrolled\' and Matching_Student__r.CurrentCohort__c = true AND Is_Valid__c  = true';
        result.totalRecords = Database.countQuery(countQuery);
        return result;

    }
    
    public class StudentWrapper{
        @AuraEnabled
        public String studentId {get; set;}

        @AuraEnabled
        public String matchId {get; set;}

        @AuraEnabled
        public String name {get; set;}

        @AuraEnabled
        public String track {get; set;}

        @AuraEnabled
        public String preferredLocation {get; set;}

        @AuraEnabled
        public String performance {get; set;}

        @AuraEnabled
        public Boolean backgroundCheck {get; set;}

        @AuraEnabled
        public String hasACar {get; set;}

        @AuraEnabled
        public String skills {get; set;}

        @AuraEnabled
        public String specialty {get; set;}

        @AuraEnabled
        public String imageLink {get; set;}

        @AuraEnabled
        public String trackFamilyName {get; set;}

        @AuraEnabled
        public String internReadinessRating {get; set;}
        
        @AuraEnabled
        public Decimal potentialMatch {get; set;}
        
        @AuraEnabled
        public Decimal possibleMatch {get; set;}
        
        @AuraEnabled
        public String matchStatus {get; set;}
    }

    //This method is used to return auto generate values(drop down while typing in the field) in learning community field while applying filter
    public static List<String> getLearningCommunityNames (String communityName){
        List<MATCH_Matching_Student__c> listOfMatchingStudents = new List<MATCH_Matching_Student__c>();
        List<String> listOfCommunityNames = new List<String>();
        Set<String> setOfCommunityNames = new Set<String>();
        String searchWord = '%'+ communityName +'%';
		listOfMatchingStudents = [Select id,Learning_Community_Name__c 
                                    FROM MATCH_Matching_Student__c
                                    WHERE Learning_Community_Name__c LIKE : searchWord];
		for(MATCH_Matching_Student__c s1 : listOfMatchingStudents){
            setOfCommunityNames.add(s1.Learning_Community_Name__c);
        }
        listOfCommunityNames.addAll(setOfCommunityNames);

       return listOfCommunityNames;
    }

    //This method is used to return auto generate values(drop down while typing in the field) in Address field while applying filter
    public static List<String> getAddresses (String address){
        List<MATCH_Matching_Student__c> seats = new List<MATCH_Matching_Student__c>();
        Set<String> setOfSeats = new Set<String>();
        Map<Id,sObject> seatIds = new Map<Id, sObject>();
        List<String> listOfAddresses = new List<String>();

        String queryIds = 'FIND {*' + address + '*} IN ALL FIELDS RETURNING MATCH_Matching_Student__c(ID, address__c)';
            
        List<List<sObject>> searchIds = search.query(queryIds);
        for(MATCH_Matching_Student__c std : (List<MATCH_Matching_Student__c>) searchIds[0]){
          setOfSeats.add(std.address__c);
        }
        listOfAddresses.addAll(setOfSeats);
		return listOfAddresses;
    }
    
    /** Function to get student name to display on top of student table*/
    public static String getStudentName(String studentId) {
        return [SELECT Student_Name__c from MATCH_Matching_Student__c where id =: studentId limit 1].Student_Name__c;
    }
}