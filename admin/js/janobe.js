$(document).on("click", ".orders", function () {
   var ordernum = $(this).data('id');
   // alert(ordernum);
    // $(".modal-body #tabledata").val( p_id );

  
      $.ajax({    //create an ajax request to load_page.php
        type:"POST",
        url: "orderedproduct.php",             
        dataType: "text",   //expect html to be returned  
        data:{ordernumber:ordernum},               
        success: function(data){                    
            $("#myModal").html(data); 
            // alert(data);

        }

    });
 
   
});


$(document).on("click", "#btnclose" , function () {
 
  
      $.ajax({    //create an ajax request to load_page.php
        type:"POST",
        url: "orderedproduct.php",             
        dataType: "text",   //expect html to be returned  
        data:{close:"close"},               
        success: function(data){                    
            
            // alert("closing");
            
              
        }

    });
 
   
});

 
 

 function checkall(selector)
  {
    if(document.getElementById('chkall').checked==true)
    {
      var chkelement=document.getElementsByName(selector);
      for(var i=0;i<chkelement.length;i++)
      {
        chkelement.item(i).checked=true;
      }
    }
    else
    {
      var chkelement=document.getElementsByName(selector);
      for(var i=0;i<chkelement.length;i++)
      {
        chkelement.item(i).checked=false;
      }
    }
  }


