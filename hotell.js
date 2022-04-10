const express=require("express");
const app=express();
const bodyParser=require("body-parser");
app.use(bodyParser.json()) // for parsing application/json;
app.use(bodyParser.urlencoded({ extended: true }));
const sqlite3 = require('sqlite3').verbose();

//swagger
const Yaml = require('yamljs');
const swaggerUI= require("swagger-ui-express");
const swaggerJsDocs=Yaml.load("./swagger.yaml");
app.use("/api-docs", swaggerUI.serve,swaggerUI.setup(swaggerJsDocs))
var meseci = {Januar:31, Februar:28,Maj:31,April:30,Maj:31,Jun:30,Jul:31,Avgust:31,Setembar:30,Oktobar:31,Novembar:30,Decembar:31};
// open the database
let db = new sqlite3.Database('./hotel.db', sqlite3.OPEN_READWRITE| sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the hotel database.');
});
  
app.get("/termini", (req,res)=>{
  var koji_hotel=req.query.hotel;
  var m=req.query.mesec;
  console.log(m)
  var koja_soba=req.query.vrsta_sobe;
  var sql=`select reservation.zakazano,sobe.broj_sobe from reservation join sobe on reservation.room_id=sobe.id where reservation.room_id in (select sobe.id from sobe where sobe.hotel_id in(select hotel.id from hotel where hotel.ime="${koji_hotel}") and sobe.vrsta_sobe in (select vrste.id from vrste where vrste.vrsta="${koja_soba}" )) order by sobe.broj_sobe asc `;
  console.log(m);
  db.all(sql, [], (err, rows) => {
    var termin=null;
    var soba=[];
    if (err) {
      throw err;
             }
    termin=rows;

    db.all("SELECT DISTINCT sobe.broj_sobe from sobe",[],(err,row)=>{
      if (err) {
        throw err;
                }
    row.forEach((element)=>{
     soba.push(element.broj_sobe)
     })
     //dostupni su termin i sobe
     var title = [];
     var ew="Februar";
     var meseci = {Januar:31, Februar:28,Mart:31,April:30,Maj:31,Jun:30,Jul:31,Avgust:31,Setembar:30,Oktobar:31,Novembar:30,Decembar:31};
     console.log(meseci[m]);
     console.log(m);
     var i=0;
     soba.forEach(s=>{
       title[i] = {
           soba: s,
           dani: []
       };
      
       for (var o=1; o<meseci[m]+1; o++) {
           title[i].dani.push(o)
       }
       
       
       i=i+1;
     })
     
     
     soba.forEach(s=>{
       for (let i = 0; i < termin.length; i++){
           for(var o=1; o<meseci[m]; o++){
           var  datum_popunjen=termin[i].zakazano;
           var  datum_popunjen=datum_popunjen.split(":");
           var od=datum_popunjen[0];
           var doo=datum_popunjen[1];
           var od=new Date(od);
           var doo=new Date(doo);
           var br=o.toString();
           var dan=new Date("2022-3-"+br);
           
           if(s==termin[i].broj_sobe && od<=dan){
             if(dan<doo){
               var index = title[s-1].dani.indexOf(o);
     
               if (index > -1) {
                 title[s-1].dani.splice(index, 1);
               };
              }
               else{break}
           }
           }
     }
     }) 
     res.send(title)    
    })                
  })
});


app.post("/prijava/:ime/:jbmg",(req,res)=>{
       var ime=req.params.ime;
       //var jbmg=req.parms.jbmg;
       var jbmg=req.params.jbmg;
       var hotel=req.query.hotel;
       var vrsta_sobe=req.query.vrsta_sobe;
       var datum=req.body.datum;
       var sql=`select * from user where user.jmbg=${jbmg};`
       console.log("1")
       db.all(sql, [], (err, rows) => {
        
        if (err) {
          throw err;
                 }
      // 1.ako je tacan uslov znaci da nemamo usera i ubacujemo ga u bazu
        if (rows.length==0){
          db.run(`INSERT INTO user (ime,jmbg) VALUES ("${ime}","${jbmg}")`, function(err) {
            
            if (err) {
              return console.log(err.message, [], (err, rows) => {  console.log(rows)});
            }
            //1.posto smo ubacili usera u bazu proverimo trazeni termin da l je slobodan
            db.all(`select * from reservation where reservation.room_id in (select sobe.id from sobe where sobe.hotel_id in(select hotel.id from hotel where hotel.ime="${hotel}") and sobe.vrsta_sobe in (select vrste.id from vrste where vrste.vrsta="${vrsta_sobe}" ))`, [], (err, rows) => {
            var zauzeto=rows;
            console.log(rows);
            console.log(zauzeto.length)
            for( let i=0;i<rows.length;i++){
              console.log("6");
              var datum_popunjen=rows[i].zakazano;
              var datum_zakazivanja = datum;
              datum_popunjen=datum_popunjen.split(":");
              var a=datum_popunjen[0];
              var b=datum_popunjen[1];
              a=a.split("-",3);
              b=b.split("-",3);
              var aa=new Date(a[2],a[1],a[0]);
              var bb=new Date(b[2],b[1],b[0]);
              datum_zakazivanja=datum_zakazivanja.split(":");
              var B=datum_zakazivanja[1];
              var A=datum_zakazivanja[0];
              A=A.split("-",3);
              B=B.split("-",3);
              var AA=new Date(A[2],A[1],A[0]);
              var BB=new Date(B[2],B[1],B[0]);
              //1.1. korisnik ne poostoji trazeni termin je popunen
              if(bb<AA<aa ||  aa<BB<bb){
                console.log("3");
                res.send(`${datum} je popunjen, izaberite drugi, predlazemo da odete na endpoint /termini post i dobicete dostupne termine za izabran mesec`)
              }


             //1.2. korisnik ne poostoji trazeni termin moze da bude slobodan onda ubacujemo ga u bazu pa seljem ovaj odg
             else if(!bb<AA<aa &&  !aa<BB<bb || zauzeto.length==0 ){
              console.log("4");
               db.all(`select sobe.id,sobe.broj_sobe from sobe where sobe.id in (select sobe.id from sobe where sobe.hotel_id in(select hotel.id from hotel where hotel.ime="${hotel}") and sobe.vrsta_sobe in (select vrste.id from vrste where vrste.vrsta="${vrsta_sobe}" ))`,[], (err, rows) => {
                 console.log(zauzeto);
                 var sve_sobe=rows;
                 console.log(sve_sobe);
                 var ubacujemo=null;
                 for (let i = 0;i<sve_sobe.length;i++){
                   if(!zauzeto.includes(sve_sobe[i])){
                     ubacujemo=sve_sobe[i];
                     break
                   }
                 }
                 console.log(ubacujemo)
                //db.run(`insert into reservation (room_id,zakazano,user_jmbg) values()`)
               })
              
                }
              }


            })
          })
        }
        // 2. ako ovaj korisnik vec postoji
        else{console.log("ovaj korisnik vec postoji");
          db.all(`select zakazano from reservation where reservation.room_id in (select sobe.id from sobe where sobe.hotel_id in(select hotel.id from hotel where hotel.ime="${hotel}") and sobe.vrsta_sobe in (select vrste.id from vrste where vrste.vrsta="${vrsta_sobe}" ))`, [], (err, rows) => {
          console.log(rows)
          for( let i=0;i<rows.length;i++){
            console.log(rows[i].zakazano);
            var datum_popunjen=rows[i].zakazano;
            var datum_zakazivanja = datum;
            datum_popunjen=datum_popunjen.split(":");
            var a=datum_popunjen[0];
            var b=datum_popunjen[1];
            a=a.split("-",3);
            b=b.split("-",3);
            var aa=new Date(a[2],a[1],a[0]);
            var bb=new Date(b[2],b[1],b[0]);
            datum_zakazivanja=datum_zakazivanja.split(":");
            var B=datum_zakazivanja[1];
            var A=datum_zakazivanja[0];
            A=A.split("-",3);
            B=B.split("-",3);
            var AA=new Date(A[2],A[1],A[0]);
            var BB=new Date(B[2],B[1],B[0]);

            //2.1. ovaj korsinik vec postoji termin je popunjen
            if(bb<AA<aa &&  aa<BB<bb)
               {res.send("ti termini su popunjeni a korisnik vec postoji u sistemu")}

           //2.2. ovaj korsinik vec postoji termin je slobodan, ubacujemo ga u bazu    
            else{db.run(`INSERT INTO reservation (ime,jmbg) VALUES ("${ime}","${jbmg}")`, function(err) {
              if (err) {
                return console.log(err.message, [], (err, rows) => {  console.log(rows)});}

              res.send(`${ime} uspesno ste rezervisali sobu na datum ${datum} `)
              })
            }
        }
        })
      }
      })
  });

app.get("/hotel/:ime/:zvezda",(req,res)=>{
    var ime=req.params.ime;
   
    console.log(ime);

    //gledam ima li user u tabeli ili je neko novi dodacemo ka ako mu je termin slobodan
   
})





app.listen(1337,()=>console.log("server is running on port 1337"));