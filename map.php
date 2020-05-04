<style type="text/css"> 

/*.scroll {
	   width: 1800px;
    height:1000px;
    border: thin solid black;*/
   /* overflow-: hidden; 
    overflow-y: auto;*/
   /* overflow: auto;
}*/
/*.bgimg {
    background-image: url('img/bgCemetery.jpg');
    /*background-color: #52575a;*/
    /*padding: 40px;*/
/*}*/


.scrolly {
   /*width: 3000px;
    height:450px;
    /*border: thin solid black;*/
    overflow: scroll;
  
}  
.scroll {
	/*width: 1200px;*/
    height:800px;
    /*border: thin solid black;
    overflow-x: hidden;*/
    overflow-y: scroll;
}

	#container {
        background: url(images/bgcemetery.png);
      background-repeat:no-repeat; 
    width:1500px; 
    height:800px;

  
    -webkit-background-size: cover;
        -moz-background-size: cover;
        -o-background-size: cover; 
        background-size: cover;
}
 .graveborder { 
        font-size: 8px;
        font-weight: bolder;
        border-width:1px;
        border-style:solid;
        border-bottom-color:#aaa;
        border-right-color:#aaa;
        border-top-color:#ddd;
        border-left-color:#ddd;
        border-radius:5px;
        -moz-border-radius:3px;
        -webkit-border-radius:3px;
        /*border:.5px solid #ddd;*/
        /*border-color: #eee; */
        /*border-style: solid;*/

    /*  border-style: solid;
        border-left: 1px solid #4e514e;
        border-right: 1px solid #4e514e;
        border-top: 1px solid #4e514e;
        border-bottom: 1px solid #4e514e;*/
        /*border-radius: 100px 0px 100px 0px;*/
        margin:0px;
        padding:0px;
    }
    .gravebg {
        background-color: #fff;
        color: #000;
        text-align: center;
        font: italic;
    }
</style>
<?php include 'map_function.php';?>
<div class="scroll" id="zoom"> 	
<div id="container">
<div class=" bgimg"  >

<div style="margin-left: 33%; margin-bottom: -11%;" >
    <table>
    <br><br><br><br><br><br>
    <tr>
       <td><?php noDetailsGrave_horizontal($start=1,$end=20,$width=15,$height=40,$section="Common_Grave"); ?></td>
    </tr>
    <tr> 
        <td><?php noDetailsGrave_horizontal($start=20,$end=40,$width=15,$height=40,$section="Common_Grave"); ?></td>
    </tr>
</table>

<table>
    <tr>
        <td><?php noDetailsGrave_horizontal($start=40,$end=60,$width=15,$height=40,$section="Common_Grave"); ?></td>
    </tr>
    <tr>
        <td><?php noDetailsGrave_horizontal($start=60,$end=80,$width=15,$height=40,$section="Common_Grave"); ?></td>
    </tr>
    <tr>
        <td><?php noDetailsGrave_horizontal($start=80,$end=100,$width=15,$height=40,$section="Common_Grave"); ?></td>
    </tr>
    <tr>
        <td><?php noDetailsGrave_horizontal($start=100,$end=120,$width=15,$height=40,$section="Common_Grave"); ?></td>
    </tr>
    <tr>
        <td><?php noDetailsGrave_horizontal($start=706,$end=712,$width=15,$height=40,$section="Mausoleum"); ?></td>
    </tr>
    </table>
    <table style="margin-left: 10%; margin-top: -3%;">
    <tr>
        <td><?php noDetailsGrave_horizontal($start=1000,$end=1005,$width=40,$height=80,$section="Mass_Grave"); ?></td>
    </tr>
</table> 
</div>


<div  style="margin-left: 62%; margin-top: -25%;">
      <table>
     <tr>
         <td><?php noDetailsGrave_horizontal($start=300,$end=320,$width=15,$height=40,$section="Common_Grave"); ?></td>
     </tr>
     <tr>
         <td><?php noDetailsGrave_horizontal($start=320,$end=339,$width=15,$height=40,$section="Common_Grave"); ?></td>
     </tr>
     <tr>
         <td><?php noDetailsGrave_horizontal($start=339,$end=358,$width=15,$height=40,$section="Common_Grave"); ?></td>
     </tr>
     <tr>
         <td><?php noDetailsGrave_horizontal($start=1009,$end=1010,$width=100,$height=130,$section="Mass_Grave"); ?></td>
     </tr>
     <tr>
         <td><?php noDetailsGrave_horizontal($start=933,$end=953,$width=15,$height=40,$section="Unknown/Unmarked_Grave"); ?></td>
     </tr>
     <tr>
         <td><?php noDetailsGrave_horizontal($start=358,$end=368,$width=15,$height=40,$section="Common_Grave"); ?></td>
     </tr>
     <tr>
         <td><?php noDetailsGrave_horizontal($start=368,$end=378,$width=15,$height=40,$section="Common_Grave"); ?></td>
     </tr>
     <tr>
         <td><?php noDetailsGrave_horizontal($start=378,$end=388,$width=15,$height=40,$section="Common_Grave"); ?></td>
     </tr>

 </table>
 <table style="margin-left: -80%; margin-top: -75%;">
<tr>
       <td><?php noDetailsGrave_vertical($start=140,$end=148,$width=15,$height=40,$section="Common_Grave"); ?></td>
       </tr>
       
</table>
<table style="margin-left: -83%; margin-top: -58%;">
<tr>
       <td><?php noDetailsGrave_vertical($start=148,$end=156,$width=15,$height=40,$section="Common_Grave"); ?></td>
       </tr>
       
</table>
<table style="margin-left: -87%; margin-top: -58%;">
<tr>
       <td><?php noDetailsGrave_vertical($start=156,$end=162,$width=15,$height=40,$section="Common_Grave"); ?></td>
       </tr>
       
</table>
<table style="margin-left: -99%; margin-top: -44%;">
<tr>
       <td><?php noDetailsGrave_horizontal($start=906,$end=910,$width=15,$height=40,$section="Unknown/Unmarked_Grave"); ?></td>
       </tr>
       <tr>
       <td><?php noDetailsGrave_horizontal($start=910,$end=914,$width=15,$height=40,$section="Unknown/Unmarked_Grave"); ?></td>
       </tr>
       <tr>
       <td><?php noDetailsGrave_horizontal($start=1005,$end=1006,$width=50,$height=70,$section="Mass_Grave"); ?></td>
       </tr>
       <br><br><br><br><br>
       <tr>
       <td><?php noDetailsGrave_horizontal($start=1006,$end=1008,$width=40,$height=50,$section="Mass_Grave"); ?></td>
       </tr>
       
</table>

<table style="margin-left: -76%; margin-top: 3%;">
<tr>
       <td><?php noDetailsGrave_horizontal($start=700,$end=706,$width=15,$height=40,$section="Mausoleum"); ?></td>
       </tr>
       
</table>
<table style="margin-left: -57%; margin-top: 1%;">
<tr>
       <td><?php noDetailsGrave_horizontal($start=921,$end=933,$width=15,$height=40,$section="Unknown/Unmarked_Grave"); ?></td>
       </tr>
       
</table>
<table style="margin-left: -37%; margin-top: -1%;">
<tr>
       <td><?php noDetailsGrave_horizontal($start=914,$end=921,$width=15,$height=40,$section="Unknown/Unmarked_Grave"); ?></td>
       </tr>
       
</table>

<table style="margin-left: -15%; margin-top: -84%;">
<tr>
       <td><?php noDetailsGrave_vertical($start=120,$end=130,$width=15,$height=40,$section="Common_Grave"); ?></td>
       </tr>
       
</table>
<table style="margin-left: -19%; margin-top: -73%;">
<tr>
       <td><?php noDetailsGrave_vertical($start=130,$end=140,$width=15,$height=40,$section="Common_Grave"); ?></td>
       </tr>
       
</table>
<table style="margin-left: 19%; margin-top: -45%;">
<tr>
       <td><?php noDetailsGrave_vertical($start=712,$end=715,$width=15,$height=40,$section="Mausoleum"); ?></td>
       </tr>  
       </table>
       <table style="margin-left: 22%; margin-top: -22%;">   
       <tr>
       <td><?php noDetailsGrave_vertical($start=715,$end=718,$width=15,$height=40,$section="Mausoleum"); ?></td>
       </tr>
       </table>
       <table style="margin-left: 26%; margin-top: -22%;">
       <tr>
       <td><?php noDetailsGrave_vertical($start=718,$end=721,$width=15,$height=40,$section="Mausoleum"); ?></td>
       </tr>
       </table>
       <table style="margin-left: 29%; margin-top: -22%;">
       <tr>
       <td><?php noDetailsGrave_vertical($start=721,$end=724,$width=15,$height=40,$section="Mausoleum"); ?></td>
       </tr>
</table>
<table style="margin-left: 33%; margin-top: -22%;">   
       <tr>
       <td><?php noDetailsGrave_vertical($start=724,$end=727,$width=15,$height=40,$section="Mausoleum"); ?></td>
       </tr>
       </table>
       <table style="margin-left: 36%; margin-top: -22%;">
       <tr>
       <td><?php noDetailsGrave_vertical($start=727,$end=730,$width=15,$height=40,$section="Mausoleum"); ?></td>
       </tr>
       </table>
       <table style="margin-left: 40%; margin-top: -22%;">
       <tr>
       <td><?php noDetailsGrave_vertical($start=730,$end=733,$width=15,$height=40,$section="Mausoleum"); ?></td>
       </tr>
</table>
<table style="margin-left: 43%; margin-top: -22%;">   
       <tr>
       <td><?php noDetailsGrave_vertical($start=733,$end=736,$width=15,$height=40,$section="Mausoleum"); ?></td>
       </tr>
       </table>
       <table style="margin-left: 47%; margin-top: -22%;">
       <tr>
       <td><?php noDetailsGrave_vertical($start=736,$end=739,$width=15,$height=40,$section="Mausoleum"); ?></td>
       </tr>
       </table>
       <table style="margin-left: 50%; margin-top: -22%;">
       <tr>
       <td><?php noDetailsGrave_vertical($start=739,$end=742,$width=15,$height=40,$section="Mausoleum"); ?></td>
       </tr>
</table>
<table style="margin-left: 29%; margin-top: 10%;">   
       <tr>
       <td><?php noDetailsGrave_horizontal($start=1008,$end=1009,$width=25,$height=120,$section="Mass_Grave"); ?></td>
       </tr>
       </table>


</div> 


</div> 
</div>
</div>
