import { Injectable, EventEmitter } from '@angular/core';
import { Http } from '@angular/http';
import {LoadingController, AlertController } from 'ionic-angular';
import 'rxjs/add/operator/map';
import { global } from '../global-variables/variable';
//import PouchDB from 'pouchdb';
import { Storage } from '@ionic/storage';
var PouchDB = require("pouchdb");
PouchDB.plugin(require('pouchdb-authentication'));



/*
  Generated class for the GestionBoutique provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class GestionBoutique {

  data: any;
  db: any;
  remote: any;
  listener: EventEmitter<any> = new EventEmitter();
  loading: any;
  pouchOpts = {
    skip_setup: true
  };

  options = {
    live: true,
    retry: true,
    continuous: true,
    //filter: 'mydesign/myfilter'
    filter: (doc) => {
      return doc._id.match(/B3[0-9a-zA-Z_:]*/);
    }
  }


  constructor(public http: Http, public loadingCtrl: LoadingController, public alertCtl: AlertController, public storage: Storage) {
    this.db = new PouchDB('stock-fuma');
    //this.db.changes({live: true, since: 'now', include_docs: true}).on('change', (change) => this.listener.emit(this.handleChange(change)));
    

    //this.remote = new PouchDB("http://localhost:5984/stock-fuma", this.pouchOpts);// 'http://localhost:5984/stock-fuma';//
    /*let optionsSaved = {
        "auth.username": "admin",
        "auth.password": "admin"
    }*/

    this.remote = new PouchDB('http://'+global.ip_serveur+':5984/stock-fuma', this.pouchOpts);
    //this.remote = 'http://localhost:5984/stock-fuma'; 

    //this.db.sync(this.remote, this.options);
    this.storage.get('boutique_id').then((id) => {
      if(id){
        this.dbSync(id);
      }
    });
  }

  createDataBase(){
    this.db = new PouchDB('stock-fuma');
    //this.remote = new PouchDB('http://'+global.ip_serveur+':5984/stock-fuma', this.pouchOpts);
  }

  showLoader(msg: any){
 
    this.loading = this.loadingCtrl.create({
      content: msg
    });
    this.loading.present();
  }

  register(username: any, mdpass: any, meta = {}){
    this.showLoader('Création du compte...');
    //let db = new PouchDB('http://localhost:5984/stock-fuma');
    this.remote.signup(username, mdpass,{metadata : meta}, (err, response) => {
      if(err){
        this.loading.dismiss();
        if (err.name === 'conflict') {
            return 'username exist';
          }else  if (err.name === 'forbidden') {
            return 'username invalide';
          } else{
            return 'erreur';
          }
      }else if(response){
        this.loading.dismiss();
        return 'success';
      }else{
        this.loading.dismiss();
        return 'echec';
      }
        
    });
  }

  login(username: any, mdpass: any){
    let ajaxOpts = {
      ajax: {
        headers: {
          Authorization: 'Basic ' + window.btoa(username + ':' + mdpass),
        }
      }
    };
    this.showLoader('Authentification...');
    this.remote.login(username, mdpass, ajaxOpts, (err, response) => {
      if (err) {
        this.loading.dismiss();
        if (err.name === 'unauthorized') {
          alert('nom ou mdpass incorrecte');
          //return 'nom ou mdpass incorrecte';
        } else {
          alert('erreur');
          //return 'erreur';
        }
      }else if(response){
        this.loading.dismiss();
        alert('success');
        //return 'success';
      }else{
        this.loading.dismiss();
        alert('echec');
        //return 'echec';
      }
    });
  }

  logout(){
    this.showLoader('Déconnexion...');
    this.remote.logout((err, response) => {
      if (err) {
        this.loading.dismissAll();
        return 'echec connexion';
      }else if(response){
        //this.data = null;
        //this.db.destroy().then(() => {
        //  console.log("base de données supprimée");
        //});
        
        this.loading.dismissAll();
        return 'success';
      }else{
        this.loading.dismiss();
        return 'echec';
      }
    });
  }

  getUser(username: any){
    this.remote.getUser(username, (err, response) => {
      if (err) {
        if (err.name === 'not_found') {
          return 'acces non autorise'
        } else {
          return 'erreur'
        }
      } else {
        return response;
      }
    });
  }

  getSession(){
    this.remote.getSession((err, response) => {
      if (err) {
        return 'erreur du réseau';
      } else if (!response.userCtx.name) {
        return 'Personne n\est connecté';
      } else {
        return response.userCtx.name;
      }
    });
  }

  updateUser(unsername: string){
    this.remote.putUser(unsername, {
      metadata : {
        email : 'robin@boywonder.com',
        birthday : '1932-03-27T00:00:00.000Z',
        likes : ['acrobatics', 'short pants', 'sidekickin\''],
      }
    }, (err, response) => {
      // etc.
    });
  }

  changerMdpass(){
    this.remote.changePassword('spiderman', 'will-remember', (err, response) => {
      if (err) {
        if (err.name === 'not_found') {
          // typo, or you don't have the privileges to see this user
        } else {
          // some other error
        }
      } else {
        // response is the user update response
        // {
        //   "ok": true,
        //   "id": "org.couchdb.user:spiderman",
        //   "rev": "2-09310a62dcc7eea42bf3d4f67e8ff8c4"
        // }
      }
    });
  }

  chagerUsername(){
    this.remote.changeUsername('spiderman', 'batman', (err) => {
      if (err) {
        if (err.name === 'not_found') {
          // typo, or you don't have the privileges to see this user
        } else if (err.taken) {
          // auth error, make sure that 'batman' isn't already in DB
        } else {
          // some other error
        }
      } else {
        // succeeded
      }
    });
  }

  dbSync(id){
    this.db.sync(this.remote, {
      live: true,
      retry: true,
      continuous: true,
      //filter: 'mydesign/myfilter'
      filter: (doc) => {
        return doc._id.match(id+'[0-9a-zA-Z_:]*');
      }
    });/*.on('change',  (info) => {
      // handle change
    }).on('paused',  (err) => {
        this.getBoutiqueById(id).then((boutique) => {
          this.storage.set('boutique_id', boutique._id);
    
          global.changerInfoBoutique = false;
          //this.ionViewDidEnter();
          //this.navCtrl.viewDidEnter;
          //this.ionViewDidEnter();
        });

        //this.ionViewDidEnter();
      // replication paused (e.g. replication up to date, user went offline)
    }).on('active',  () => {
      // replicate resumed (e.g. new changes replicating, user went back online)
    }).on('denied',  (err) => {
      alert('Droit insuffissant pour la synchronisation');
      // a document failed to replicate (e.g. due to permissions)
    }).on('complete',  (info) => {
      this.getBoutiqueById(id).then((boutique) => {
          this.storage.set('boutique_id', boutique._id);
    
          global.changerInfoBoutique = false;
          //this.ionViewDidEnter();
          //this.navCtrl.viewDidEnter;
          //this.ionViewDidEnter();
        });

        
      // handle complete
    }).on('error',  (err) => {
      alert('Erreur lors de la synchronisation');
      // handle error
    });*/
    
  }

  /*doSync(){
    this.db = new PouchDB('stock-fuma');
    this.db.changes({live: true, since: 'now', include_docs: true}).on('change', (change) => this.listener.emit(this.handleChange(change)));
    //this.remote = new PouchDB("http://localhost:5984/stock-fuma", this.pouchOpts);// 'http://localhost:5984/stock-fuma';
    this.remote = new PouchDB("http://"+global.ip_serveur+":5984/stock-fuma", this.pouchOpts)
    /*let options = {
      live: true,
      retry: true,
      continuous: true
    } *

    this.db.sync(this.remote, this.options);
}*/

  getBoutiqueById(id){
    return this.db.get(id);
  }

  getRemoteBoutiqueById(id){
    return this.remote.get(id);
  }

  getDocById(id){
    return this.db.get(id);
  }

  public checkExists(id: string) {
        return this.getBoutiqueById(id).then(result => {
            if(!result.supprime || result.supprime === false){
               return true
            }else{
               return false
            }
        }, error => {
            //not found error message
            if (error.status == "404") {
                return false
            } else {
                //other errors
                return false
            }
        });
    }

    public checkRemoteExists(id: string) {
        return this.getRemoteBoutiqueById(id).then(result => {
            if(!result.supprime || result.supprime === false){
               return true
            }else{
               return false
            }
        }, error => {
            //not found error message
            if (error.status == "404") {
                return false
            } else {
                //other errors
                return false
            }
        });
    }


    reset(){
 
      this.data = null;
  
      this.db.destroy().then(() => {
        console.log("database removed");
      });
    }


  getBoutiques(action = ''){

    //si non vide
    if(this.data){
      return this.data
    }

    return new Promise ( resolve => {
      this.db.allDocs({
        include_docs: true
      }).then((result) => {
        this.data = [];
        let doc = result.rows.map((row) => {
          if(action === 'ajout'){
            this.data.push(row.doc);
          }else{
            if(!row.doc.supprime || row.doc.supprime === false){
              this.data.push(row.doc);
            }
          }
        });

        resolve(this.data);

        this.db.changes({live: true, since: 'now', include_docs: true}).on('change', (change) => this.listener.emit(this.handleChange(change)));
      }).catch((err) => console.log(err));
    } );
  }

  getPlageDocs(startkey, endkey, action = ''){

    //si non vide
    let data: any;
    if(data){
      return data
    }

    

    return new Promise ( resolve => {
      this.db.allDocs({
        include_docs: true,
        startkey: startkey,
        endkey: endkey
      }).then((result) => {
        data = [];
        let doc = result.rows.map((row) => {
          if(action === 'ajout'){
            data.push(row.doc);
          }else{
            if(!row.doc.supprime || row.doc.supprime === false){
              data.push(row.doc);
            }
          }
        });

        resolve(data);

        this.db.changes({live: true, since: 'now', include_docs: true}).on('change', (change) => this.handleChange(change));
      }).catch((err) => console.log(err));
    } );
  }


  createBoutique(boutique){
    let dat = new Date();
    boutique.created_at = dat.toJSON();
    boutique.updatet_at = dat.toJSON();
    boutique.created_by = '';
    boutique.updated_by = '';
    boutique.deleted_at = '';
    boutique.deleted_by = '';
    boutique.supprime = false;
    this.db.post(boutique);
  }

  createDoc(doc){
    let dat = new Date();
    doc.created_at = dat.toJSON();
    doc.updatet_at = dat.toJSON();
    doc.created_by = '';
    doc.updated_by = '';
    doc.deleted_at = '';
    doc.deleted_by = '';
    doc.supprime = false;
    this.db.put(doc);
  }

  updateBoutique(boutique){
    let dat = new Date();
    boutique.updatet_at = dat.toJSON();
    boutique.updated_by = '';
    boutique.deleted_at = '';
    boutique.deleted_by = '';
    boutique.supprime = false;
    this.db.put(boutique).catch((err) => console.log(err));
  }

  updateDoc(doc){
    let dat = new Date();
    doc.updatet_at = dat.toJSON();
    doc.updated_by = '';
    doc.deleted_at = '';
    doc.deleted_by = '';
    doc.supprime = false;
    this.db.put(doc).catch((err) => console.log(err));
  }

  deleteBoutique(boutique){
    let dat = new Date();
    boutique.deleted_at = dat.toJSON();
    boutique.deleted_by = '';
    boutique.supprime = true;
    this.db.put(boutique).catch((err) => console.log(err));
    //this.db.remove(boutique).catch((err) => console.log(err));
  }

  deleteDoc(doc){
    let dat = new Date();
    doc.deleted_at = dat.toJSON();
    doc.deleted_by = '';
    //doc._deleted = true;
    doc.supprime = true;
    //this.db.remove(doc).catch((err) => console.log(err));
    this.db.put(doc).catch((err) => console.log(err));
  }

  handleChange(change){
    let changeDoc = null;
    let changeIndex = null;

    this.data.forEach((doc, index) => {
      if(doc._id === change.id){
        changeDoc = doc;
        changeIndex = index;
      }
    });

    //le document a ete supprime

    if(change.delete){
      this.data.splice(changeIndex, 1);
    }else{
      //mise a jour
      if(changeDoc){
        this.data[changeIndex] = change.doc;
      }
      //ajout
      else{
        this.data.push(change.doc);
      }
    }
  }
}
