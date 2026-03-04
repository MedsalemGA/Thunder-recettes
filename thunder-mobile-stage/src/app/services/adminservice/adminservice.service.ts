import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class AdminserviceService {
  alertMessage = "";
  color = "";

  constructor() {

   }
   tooglepassword(hidePassword: boolean){
    hidePassword = !hidePassword;
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
}
