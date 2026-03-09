import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { finalize } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminserviceService {
  alertMessage = "";
  color = "";

  constructor(private http: HttpClient) {

   }
  
  ontype(event: KeyboardEvent,password:string)
  {
    
   
    if(this.findmaj(password)===false && this.findother(password)===false){
      this.alertMessage='Votre mot de passe est tres faible!';
      this.color='red';
      return;
    }
    if(this.findmaj(password)===true || this.findother(password)===true ){
      
     this.alertMessage='Votre mot de passe est moyen';
      this.color='yellow'
    }
    if(this.findmaj(password)===true && this.findother(password)===true){
      this.alertMessage='Mot de passe fort!';
      this.color='green';
    }
    
  }
  findmaj(password:string){
    for(let i=0;i<password.length;i++){
      const char = password[i];
       if (char >= 'A' && char <= 'Z') {   
      return true;
    }
    }
    return false;
  }
  findother(password:string){
    for(let i=0;i<password.length;i++){

      if(password[i]==='@' || password[i]==='!' || password[i]==='#' || password[i]==='$' || password[i]==='%' || password[i]==='^' || password[i]==='&' || password[i]==='*' || password[i]==='(' || password[i]===')' || password[i]==='-' || password[i]==='_' || password[i]==='+' || password[i]==='=' || password[i]==='{' || password[i]==='}' || password[i]==='[' || password[i]===']' || password[i]==='|' || password[i]==='\\' || password[i]===':' || password[i]===';' || password[i]==='"' || password[i]==='<' || password[i]==='>' || password[i]==='?' || password[i]==='/'){
        return true;
      }
    }
    return false;
  }
  findfournisseur(query:string){
    return this.http.get('http://localhost:8000/api/chercherfournisseurs?query='+query);
  }
  getallfournisseurs():any{
  

   return  this.http.get('http://localhost:8000/api/getallforunisseur');
   
  }
  deletefournisseur(id:number){
    return this.http.delete('http://localhost:8000/api/deletefournisseur?id='+id);

  }
  updatefournisseur(id,data:any){
    return this.http.patch('http://localhost:8000/api/updatefournisseur?id='+id,data);
  }
  showallrecettes(){
    return this.http.get('http://localhost:8000/api/getallrecettes');
  }
  ajouterrecettes(data:any){
    return this.http.post('http://localhost:8000/api/ajouterrecettes',data);
  }
  updaterecettes(id:number,data:any){
    return this.http.patch('http://localhost:8000/api/updaterecettes?id='+id,data);
  }
  deleterecettes(id:number){
    return this.http.delete('http://localhost:8000/api/deleterecettes?id='+id);
  }
  
}
