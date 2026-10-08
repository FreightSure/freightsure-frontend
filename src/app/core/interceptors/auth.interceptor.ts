import {
  HttpInterceptorFn
} from '@angular/common/http';


export const authInterceptor: HttpInterceptorFn = (
  req,
  next
) => {

  const token =
    localStorage.getItem(
      'freightsure_token'
    );


  /*
   * Si aucun token n'existe,
   * on laisse passer la requête normalement.
   */
  if (!token) {

    return next(req);

  }


  /*
   * Si le token existe,
   * on clone la requête et on ajoute
   * Authorization: Bearer TOKEN
   */
  const authenticatedRequest =
    req.clone({

      setHeaders: {

        Authorization:
          `Bearer ${token}`

      }

    });


  return next(
    authenticatedRequest
  );

};