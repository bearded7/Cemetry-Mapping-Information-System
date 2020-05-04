<!DOCTYPE html>
<html lang="en">

<head>
    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title><?php echo $title;?></title>
    <!-- plugins:css -->
    <link rel="stylesheet" href="pretty/vendors/mdi/css/materialdesignicons.min.css">
    <link rel="stylesheet" href="pretty/vendors/base/vendor.bundle.base.css">
    <!-- endinject -->
    <!-- plugin css for this page -->
    <link rel="stylesheet" href="pretty/vendors/datatables.net-bs4/dataTables.bootstrap4.css">
    <!-- End plugin css for this page -->
    <!-- inject:css -->
    <link rel="stylesheet" href="pretty/css/style.css">
    <!-- endinject 
    <link rel="icon" href="pretty/images/logo1.png" type="image/x-icon">
    <link rel="shortcut icon" href="pretty/images/logo1.png" type="image/x-icon" />    -->
    <link rel="shortcut icon" href="pretty/images/logo1.png" />
 <!-- Bootstrap Core CSS -->
    <link href="<?php echo web_root; ?>css/bootstrap.min.css" rel="stylesheet">


<!-- Custom Fonts -->
    <link href="<?php echo web_root; ?>font/css/font-awesome.min.css" rel="stylesheet" type="text/css">

    <link href="<?php echo web_root; ?>font/font-awesome.min.css" rel="stylesheet" type="text/css"> 
<!-- DataTables CSS -->
    <link href="<?php echo web_root; ?>css/dataTables.bootstrap.css" rel="stylesheet">

<!-- datetime picker CSS -->
    <link href="<?php echo web_root; ?>css/bootstrap-datetimepicker.min.css" rel="stylesheet" media="screen">

    <link href="<?php echo web_root; ?>css/ekko-lightbox.css" rel="stylesheet">
    <link href="<?php echo web_root; ?>css/modern.css" rel="stylesheet">
    <link href="<?php echo web_root; ?>css/costum.css" rel="stylesheet">
    <link href="<?php echo web_root; ?>css/navbar.css" rel="stylesheet">
    <link rel="icon" href="<?php echo web_root; ?>img/favicon.ico" type="image/x-icon"> 

</head>


<?php
   admin_confirm_logged_in();
  ?> 

            <?php
if (isset($_GET['category'])) {
  # code...
   $categid = isset($_GET['category']) ? $_GET['category'] : ''; 
  $sql="SELECT * FROM `tbltype` WHERE `TYPEID`=".$categid;
  $mydb->setQuery($sql);
  $cur = $mydb->loadSingleResult();
}
?>
      
<body>
  <div class="container-scroller">
        <nav class="navbar col-lg-12 col-12 p-0 fixed-top d-flex flex-row">
            <div class="navbar-brand-wrapper d-flex justify-content-center">
                <div class="navbar-brand-inner-wrapper d-flex justify-content-between align-items-center w-100">
                    <a class="navbar-brand brand-logo" href="<?php echo web_root; ?>admin/index.php"><img src="images/" alt="CMIS" /></a>
                    <a class="navbar-brand brand-logo-mini" href="<?php echo web_root; ?>admin/index.php"><img src="images/" alt="CMIS" /></a>
                    <button class="navbar-toggler navbar-toggler align-self-center" type="button" data-toggle="minimize">
            <span class="mdi mdi-sort-variant"></span>
          </button>
                </div>
            </div>
            <div class="navbar-menu-wrapper d-flex align-items-center justify-content-end">
                <ul class="navbar-nav mr-lg-4 w-100">
                  <form id="find-form" action="<?php echo web_root; ?>admin/person/index.php?view" method="POST">
                    <li class="nav-item nav-search d-none d-lg-block w-100">
                        <div class="input-group">
                            <div class="input-group-prepend">
                                <span class="input-group-text" id="search">
                  <i class="mdi mdi-account-search"></i>
                </span>
                            </div>
                            <input type="" class="form-control" placeholder="Search for Grave No, Name" name="search" aria-label="search" aria-describedby="search">
                            <path d="M11.618 9.897l4.224 4.212c.092.09.1.23.02.312l-1.464 1.46c-.08.08-.222.072-.314-.02L9.868 11.66M6.486 10.9c-2.42 0-4.38-1.955-4.38-4.367 0-2.413 1.96-4.37 4.38-4.37s4.38 1.957 4.38 4.37c0 2.412-1.96 4.368-4.38 4.368m0-10.834C2.904.066 0 2.96 0 6.533 0 10.105 2.904 13 6.486 13s6.487-2.895 6.487-6.467c0-3.572-2.905-6.467-6.487-6.467 "></path>
                            </form>
                        </div>
                    </li>
                </ul>
                
      
                <ul class="navbar-nav navbar-nav-right">
                    <!--<li class="nav-item dropdown mr-1">
                        <a class="nav-link count-indicator dropdown-toggle d-flex justify-content-center align-items-center" id="messageDropdown" href="#" data-toggle="dropdown">
                            <i class="mdi mdi-message-text mx-0"></i>
                            <span class="count"></span>
                        </a>
                        <div class="dropdown-menu dropdown-menu-right navbar-dropdown" aria-labelledby="messageDropdown">
                            <p class="mb-0 font-weight-normal float-left dropdown-header">Messages</p>
                            <a class="dropdown-item">
                                <div class="item-thumbnail">
                                    <img src="images/faces/face4.jpg" alt="image" class="profile-pic">
                                </div>
                                <div class="item-content flex-grow">
                                    <h6 class="ellipsis font-weight-normal">David Grey
                                    </h6>
                                    <p class="font-weight-light small-text text-muted mb-0">
                                        The meeting is cancelled
                                    </p>
                                </div>
                            </a>
                            <a class="dropdown-item">
                                <div class="item-thumbnail">
                                    <img src="images/faces/face2.jpg" alt="image" class="profile-pic">
                                </div>
                                <div class="item-content flex-grow">
                                    <h6 class="ellipsis font-weight-normal">Tim Cook
                                    </h6>
                                    <p class="font-weight-light small-text text-muted mb-0">
                                        New product launch
                                    </p>
                                </div>
                            </a>
                            <a class="dropdown-item">
                                <div class="item-thumbnail">
                                    <img src="images/faces/face3.jpg" alt="image" class="profile-pic">
                                </div>
                                <div class="item-content flex-grow">
                                    <h6 class="ellipsis font-weight-normal"> Johnson
                                    </h6>
                                    <p class="font-weight-light small-text text-muted mb-0">
                                        Upcoming board meeting
                                    </p>
                                </div>
                            </a>
                        </div>
                    </li>-->
                    <li class="nav-item dropdown mr-4">
                        <a class="nav-link count-indicator dropdown-toggle d-flex align-items-center justify-content-center notification-dropdown" id="notificationDropdown" href="#" data-toggle="dropdown">
                            <i class="mdi mdi-account-location mx-0"></i>
                            <span class="count"></span>
                        </a>
                        <div class="dropdown-menu dropdown-menu-right navbar-dropdown" aria-labelledby="notificationDropdown">
            
                        <a href="<?php echo web_root; ?>admin/person/index.php?view=add" class="dropdown-item">
                                <i class="fa fa-users fa-fw text-primary"></i> Add Burial Record
                            </a>
 
                        <a href="<?php echo web_root; ?>admin/category/index.php?view=add" class="dropdown-item">
                                <i class="fa fa-list fa-fw text-primary"></i> New Section
                            </a>

                            <?php if ($_SESSION['U_ROLE']=='Administrator') {
                            # code...
                        ?>
    
                        <a href="<?php echo web_root; ?>admin/user/index.php?view=add" class="dropdown-item">
                                <i class="fa fa-user  fa-fw text-primary"></i> Users
                            </a>
                            <?php }?>
                       <!-- <p class="mb-0 font-weight-normal float-left dropdown-header">Notifications</p>
                            <a class="dropdown-item">
                                <div class="item-thumbnail">
                                    <div class="item-icon bg-success">
                                        <i class="mdi mdi-information mx-0"></i>
                                    </div>
                                </div>
                                <div class="item-content">
                                    <h6 class="font-weight-normal">Application Error</h6>
                                    <p class="font-weight-light small-text mb-0 text-muted">
                                        Just now
                                    </p>
                                </div>
                            </a>
                            <a class="dropdown-item">
                                <div class="item-thumbnail">
                                    <div class="item-icon bg-warning">
                                        <i class="mdi mdi-settings mx-0"></i>
                                    </div>
                                </div>
                                <div class="item-content">
                                    <h6 class="font-weight-normal">Settings</h6>
                                    <p class="font-weight-light small-text mb-0 text-muted">
                                        Private message
                                    </p>
                                </div>
                            </a>
                            <a class="dropdown-item">
                                <div class="item-thumbnail">
                                    <div class="item-icon bg-info">
                                        <i class="mdi mdi-account-box mx-0"></i>
                                    </div>
                                </div>
                                <div class="item-content">
                                    <h6 class="font-weight-normal">New user registration</h6>
                                    <p class="font-weight-light small-text mb-0 text-muted">
                                        2 days ago
                                    </p>
                                </div>
                            </a>-->
                        </div>
                    </li>

<?php
$user = New User();
$singleuser = $user->single_user($_SESSION['USERID']);

?> 

                    <li class="nav-item nav-profile dropdown">
                        <a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown" id="profileDropdown">
                            <img src="<?php echo web_root.'admin/user/'.$singleuser ->USERIMAGE ?>" alt="ImageAdmin" />
                            <span class="nav-profile-name">Hey, <?php echo $_SESSION['U_NAME']; ?></span>
                        </a>
                        <div class="dropdown-menu dropdown-menu-right navbar-dropdown">

                        <a class="dropdown-item" href="<?php echo web_root; ?>admin/user/index.php?view=edit&id=<?php echo $_SESSION['USERID']; ?>">
                                <i class="mdi mdi-settings text-primary"></i> Edit Profile
                            </a>
                            <a class="dropdown-item" href="<?php echo web_root; ?>admin/logout.php" > 
                                <i class="mdi mdi-logout text-primary"></i> Logout
                            </a>

                        </div>
                    </li>
                </ul>
                <button class="navbar-toggler navbar-toggler-right d-lg-none align-self-center" type="button" data-toggle="offcanvas">
          <span class="mdi mdi-menu"></span>
        </button>
            </div>
        </nav>

        <div class="container-fluid page-body-wrapper" style="margin-top: -3%;">
        
        <nav class="sidebar sidebar-offcanvas" id="sidebar">
            <ul class="nav">
                <li class="nav-item">
                    <a class="nav-link" href="<?php echo web_root; ?>admin/index.php">
                        <i class="mdi mdi-home menu-icon"></i>
                        <span class="menu-title">Dashboard</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="<?php echo web_root; ?>admin/person/index.php">
                        <i class=" mdi mdi-seat-flat  menu-icon"></i>
                        <span class="menu-title">Burial Records</span>
                        
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="<?php echo web_root; ?>admin/category/index.php">
                        <i class=" mdi mdi-shape-square-plus  menu-icon"></i>
                        <span class="menu-title">Grave Types</span>
                    </a>
                </li>

                <?php if ($_SESSION['U_ROLE']=='Administrator') {
                            # code...
                        ?> 

                <li class="nav-item">
                    <a class="nav-link" href="<?php echo web_root; ?>admin/import/index.php">
                        <i class=" mdi mdi-attachment menu-icon"></i>
                        <span class="menu-title">Import Excel File</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="<?php echo web_root; ?>admin/user/index.php">
                        <i class="mdi mdi-account menu-icon"></i>
                        <span class="menu-title">Manage Users</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="<?php echo web_root; ?>admin/report/index.php">
                        <i class=" mdi mdi-file-multiple menu-icon"></i>
                        <span class="menu-title">Reports</span>
                    </a>
                </li>

                <?php }  ?>
            </ul>
        </nav>




        <div class="main-panel">
        <div class="content-wrapper">



                    <div style="margin-left: 2%; margin-top: 1%; margin-bottom: 3%; margin-right: 3%"> 
                    <?php 
                    if ($title<>'Administrator Panel'){
                       echo   '
                    <p class="breadcrumbs col-lg-12" >  <a href="'. web_root.'admin/index.php" title="Administrator Panel" >Administrator Panel</a>  / 
                        <a href="index.php" title="'. $title.'" >'. $title.'</a> 
                        '.(isset($header) ? ' / '. $header : '') .'   </p>'  ;
                    } ?>
                       
                    <?php   check_message();  ?>   
                  <?php require_once $content; ?>
                    
                </div>
                       <!-- /.col-lg-12 -->

            </div>
            <!-- /.row -->
            
        </div>
        <!-- /#page-wrapper -->

    </div>
    <!-- /#wrapper -->

    </div>

  
  

           
            <footer class="footer">
          <div class="d-sm-flex justify-content-center justify-content-sm-between">
            <span class="text-muted text-center text-sm-left d-block d-sm-inline-block">Copyright &copy;2020  </span>
            <span class="float-none float-sm-right d-block mt-1 mt-sm-0 text-center"><a href="" target="_blank">XaLabs03 Creative Studios</a> | Oriba Douglas</span>
          </div>
        </footer>
        <!-- partial -->
      </div>
      <!-- main-panel ends -->
    </div>
    <!-- page-body-wrapper ends -->
  </div>

  
    <!-- plugins:js -->
    <script src="pretty/vendors/base/vendor.bundle.base.js"></script>
    <!-- endinject -->
    <!-- Plugin js for this page-->
    <script src="pretty/vendors/chart.js/Chart.min.js"></script>
    <script src="pretty/vendors/datatables.net/jquery.dataTables.js"></script>
    <script src="pretty/vendors/datatables.net-bs4/dataTables.bootstrap4.js"></script>
    <!-- End plugin js for this page-->
    <!-- inject:js -->
    <script src="pretty/js/off-canvas.js"></script>
    <script src="pretty/js/hoverable-collapse.js"></script>
    <script src="pretty/js/template.js"></script>
    <!-- endinject -->
    <!-- Custom js for this page-->
    <script src="pretty/js/dashboard.js"></script>
    <script src="pretty/js/data-table.js"></script>
    <script src="pretty/js/jquery.dataTables.js"></script>
    <script src="pretty/js/dataTables.bootstrap4.js"></script>
    <!-- End custom js for this page-->
    <!-- end of page  -->

 
<!-- jQuery -->
<script src="<?php echo web_root; ?>admin/jquery/jquery.min.js"></script>

<!-- Bootstrap Core JavaScript -->
<script src="<?php echo web_root; ?>admin/js/bootstrap.min.js"></script>

<!-- Metis Menu Plugin JavaScript -->
<script src="<?php echo web_root; ?>admin/js/metisMenu.min.js"></script>

<!-- DataTables JavaScript -->
<script src="<?php echo web_root; ?>admin/js/jquery.dataTables.min.js"></script>
<script src="<?php echo web_root; ?>admin/js/dataTables.bootstrap.min.js"></script>

<script type="text/javascript" src="<?php echo web_root; ?>js/bootstrap-datepicker.js" charset="UTF-8"></script>
<script type="text/javascript" src="<?php echo web_root; ?>js/bootstrap-datetimepicker.js" charset="UTF-8"></script>
<script type="text/javascript" src="<?php echo web_root; ?>js/bootstrap-datetimepicker.uk.js" charset="UTF-8"></script>

<script type="text/javascript" language="javascript" src="<?php echo web_root; ?>admin/input-mask/jquery.inputmask.js"></script> 
<script type="text/javascript" language="javascript" src="<?php echo web_root; ?>admin/input-mask/jquery.inputmask.date.extensions.js"></script> 
<script type="text/javascript" language="javascript" src="<?php echo web_root; ?>admin/input-mask/jquery.inputmask.extensions.js"></script> 

<!-- Custom Theme JavaScript -->
<script src="<?php echo web_root; ?>admin/js/ekko-lightbox.js"></script>
<script src="<?php echo web_root; ?>admin/js/sb-admin-2.js"></script> 

<script type="text/javascript" language="javascript" src="<?php echo web_root; ?>admin/js/janobe.js"></script> 
<script src="<?php echo web_root; ?>admin/select2/select2.full.min.js"></script>
    
<script type="text/javascript">


$(".select2").select2();

//Datemask2 mm/dd/yyyy
$("#datemask2").inputmask("mm/dd/yyyy", {"placeholder": "mm/dd/yyyy"});
//Money Euro
$("[data-mask]").inputmask();


$(document).ready(function() {
$('#dash-table').DataTable({
         responsive: true ,
           "sort": true
 });

$('#example').DataTable({
         responsive: true ,
           "sort": false
 });

});

$(document).on("click", ".DESIGNID", function () {
// var id = $(this).attr('id');
var proid = $(this).data('id')
// alert(proid)
$(".modal-body #proid").val( proid )

}); 

  






 </script>
 


<script>
 


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
   function checkNumber(textBox){
        while (textBox.value.length > 0 && isNaN(textBox.value)) {
          textBox.value = textBox.value.substring(0, textBox.value.length - 1)
        }
        textBox.value = trim(textBox.value);
      }
      //
      function checkText(textBox)
      {
        var alphaExp = /^[a-zA-Z]+$/;
        while (textBox.value.length > 0 && !textBox.value.match(alphaExp)) {
          textBox.value = textBox.value.substring(0, textBox.value.length - 1)
        }
        textBox.value = trim(textBox.value);
      }
  

       

//        In jQuery, the following would work:

// $("#id_of_textbox").keyup(function(event) {
//     if (event.keyCode === 13) {
//         $("#id_of_button").click();
//     }
// });
// Or in plain JavaScript, the following would work:

// document.getElementById("id_of_textbox")
//     .addEventListener("keyup", function(event) {
//     event.preventDefault();
//     if (event.keyCode === 13) {
//         document.getElementById("id_of_button").click();
//     }
// });

  </script>    

<script>
    // tooltip demo
    // $('.tooltip-demo').tooltip({
    //     selector: "[data-toggle=tooltip]",
    //     container: "body"
    // })

    // // popover demo
    // $("[data-toggle=popover]")
    //     .popover()\
    $(document).ready(function () {
  //can also be wrapped with:
  //1. $(function () {...});
  //2. $(window).load(function () {...});
  //3. Or your own custom named function block.
  //It's better to wrap it.

  //Tooltip, activated by hover event
  $("body").tooltip({   
    selector: "[data-toggle='tooltip']",
    container: "body"
  })
    //Popover, activated by clicking
    .popover({
    selector: "[data-toggle='popover']",
    container: "body",
    html: true

  });

     $('.tooltip-inner').css('min-width', '400px');
    $('.tooltip-inner').css('color', 'red');

  //They can be chained like the example above (when using the same selector).
  
});

$('body').on('click', function (e) {
    $('[data-toggle="popover"]').each(function () {
        //the 'is' for buttons that trigger popups
        //the 'has' for icons within a button that triggers a popup
        if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
            $(this).popover('hide');
        }
    });
});
    </script>

    
    </body>


</html>