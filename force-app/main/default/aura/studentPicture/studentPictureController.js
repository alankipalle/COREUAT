({
    doInit: function (cmp, evt, hlpr) {  

        cmp.set('v.reqdField',
                cmp.getReference(
                    'v.simpleRecord.'+
                    cmp.get('v.requiredField')));
        cmp.set('v.reqdField1',
                cmp.getReference(
                    'v.simpleRecord.'+
                    cmp.get('v.requiredField1')));
        var myresults =[];
        myresults.push(cmp.get('v.requiredField'));
        myresults.push(cmp.get('v.requiredField1'));
        cmp.set('v.requiredFields',myresults);
        cmp.find('originalRecord').reloadRecord(true); 
        console.log('requiredFields '+cmp.get('v.requiredField'));
        //alert(cmp.get('v.requiredField'));
        console.log('myresults '+myresults);
        //alert(myresults);
    }
})