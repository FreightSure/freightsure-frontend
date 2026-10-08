import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  email: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  login(): void {
    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez saisir votre email et mot de passe.';
      return;
    }

    this.isLoading = true;

    // Appel réel au backend via AuthService
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        // Le token est sauvegardé dans localStorage par AuthService (tap)
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 0) {
          this.errorMessage = 'Impossible de contacter le serveur. Vérifiez que le backend est démarré sur http://localhost:5288.';
        } else if (err.status === 401 || err.status === 400) {
          this.errorMessage = 'Email ou mot de passe incorrect.';
        } else if (err.status === 500) {
          this.errorMessage = 'Erreur serveur. Vérifiez les logs du backend.';
        } else {
          this.errorMessage = `Erreur de connexion (${err.status}). Réessayez.`;
        }
      }
    });
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }
}