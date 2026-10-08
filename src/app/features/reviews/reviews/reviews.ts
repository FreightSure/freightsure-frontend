import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../../core/services/review.service';
import { ReviewDto, CreateReviewCommand } from '../../../core/models/api.models';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reviews.html',
  styleUrls: ['./reviews.css']
})
export class Reviews implements OnInit {
  reviews: ReviewDto[] = [];
  searchTerm = '';
  isLoading = false;
  errorMessage = '';
  showModal = false;
  isEditing = false;
  isSubmitting = false;
  deleteConfirmId: string | null = null;
  form: CreateReviewCommand & { id?: string } = this.emptyForm();
  readonly stars = [1, 2, 3, 4, 5];

  constructor(private reviewService: ReviewService) {}
  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.reviewService.getAll().subscribe({
      next: (data) => { this.reviews = data; this.isLoading = false; },
      error: () => { this.errorMessage = 'Impossible de charger les avis.'; this.isLoading = false; }
    });
  }

  get totalReviews(): number { return this.reviews.length; }
  get averageRating(): string {
    if (!this.reviews.length) return '0.0';
    return (this.reviews.reduce((sum, r) => sum + r.rating, 0) / this.reviews.length).toFixed(1);
  }
  get excellentReviews(): number { return this.reviews.filter(r => r.rating >= 4).length; }

  get filteredReviews(): ReviewDto[] {
    const s = this.searchTerm.toLowerCase().trim();
    if (!s) return this.reviews;
    return this.reviews.filter(r => r.comment.toLowerCase().includes(s));
  }

  starsArray(rating: number): number[] { return Array(rating).fill(0); }
  emptyStars(rating: number): number[] { return Array(5 - rating).fill(0); }

  openAddModal(): void { this.form = this.emptyForm(); this.isEditing = false; this.showModal = true; }
  openEditModal(r: ReviewDto): void {
    this.form = { id: r.id, deliveryId: r.deliveryId, rating: r.rating, comment: r.comment, reviewDate: r.reviewDate.substring(0, 10) };
    this.isEditing = true; this.showModal = true;
  }
  closeModal(): void { this.showModal = false; }
  submitForm(): void {
    this.isSubmitting = true;
    if (this.isEditing && this.form.id) {
      this.reviewService.update(this.form as any).subscribe({
        next: () => { this.isSubmitting = false; this.closeModal(); this.load(); },
        error: () => { this.isSubmitting = false; }
      });
    } else {
      this.reviewService.create(this.form).subscribe({
        next: () => { this.isSubmitting = false; this.closeModal(); this.load(); },
        error: () => { this.isSubmitting = false; }
      });
    }
  }
  confirmDelete(id: string): void { this.deleteConfirmId = id; }
  cancelDelete(): void { this.deleteConfirmId = null; }
  deleteReview(): void {
    if (!this.deleteConfirmId) return;
    this.reviewService.delete(this.deleteConfirmId).subscribe({ next: () => { this.deleteConfirmId = null; this.load(); }, error: () => { this.deleteConfirmId = null; } });
  }
  private emptyForm(): CreateReviewCommand { return { deliveryId: '', rating: 5, comment: '', reviewDate: new Date().toISOString().substring(0, 10) }; }
}
