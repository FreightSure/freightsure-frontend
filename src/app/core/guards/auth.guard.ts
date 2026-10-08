import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';


export const authGuard: CanActivateFn = () => {

  const router =
    inject(Router);


  const token =
    localStorage.getItem(
      'freightsure_token'
    );


  /*
   * Utilisateur connecté
   */
  if (token) {

    return true;

  }


  /*
   * Utilisateur non connecté
   */
  return router.createUrlTree([
    '/login'
  ]);

};