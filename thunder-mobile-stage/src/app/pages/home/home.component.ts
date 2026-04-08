import {
  Component, OnInit, OnDestroy,
  ViewChild, ElementRef, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { Router }       from '@angular/router';
import { addIcons }     from 'ionicons';
import {
  notificationsOutline,
  searchOutline,
  closeCircle, closeOutline,
  timeOutline, trendingUpOutline,
  chevronForwardOutline,
  arrowForwardOutline,
  restaurantOutline, cartOutline,
  add, remove, trash,
} from 'ionicons/icons';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import {RouterModule } from '@angular/router';

import { SearchService, SearchResultItem } from '../../services/search.service';

export { SearchResultItem };

export interface SearchResultGroup {
  type:  string;
  label: string;
  icon:  string;
  items: SearchResultItem[];
}

const RECENT_KEY = 'thunder_recent_searches';
const MAX_RECENT = 5;

@Component({
  selector:    'app-home',
  templateUrl: './home.component.html',
  styleUrls:   ['./home.component.scss'],
  standalone:  true,
  // ⚠️  Pas de IonHeader ici — on n'utilise plus de header Ionic
  imports: [CommonModule, FormsModule, IonContent, IonIcon, RouterModule],
})
export class HomeComponent implements OnInit, OnDestroy {

  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  // ── Search state ─────────────────────────────────────────────────────
  searchQuery       = '';
  searchFocused     = false;
  showSearchOverlay = false;
  isSearching       = false;
  searchResults:  SearchResultItem[]  = [];
  groupedResults: SearchResultGroup[] = [];

  // ── Suggestions ──────────────────────────────────────────────────────
  recentSearches:   string[] = [];
  trendingSearches: string[] = [
    'Couscous', 'Poulet rôti', 'Salade César', 'Pizza', 'Tajine',
    // TODO: GET /api/search/trending
  ];

  // ── Scroll state (pour cacher le brand au scroll) ────────────────────
  isScrolled = false;

  // ── Notifications ─────────────────────────────────────────────────────
  hasNotifications = true;

  private searchSubject = new Subject<string>();
  private destroy$      = new Subject<void>();

  constructor(
    private router: Router, 
    private cdr: ChangeDetectorRef,
   
    private searchService: SearchService
  ) {
    addIcons({
      notificationsOutline,
      searchOutline,
      closeCircle, closeOutline,
      timeOutline, trendingUpOutline,
      chevronForwardOutline,
      arrowForwardOutline,
      restaurantOutline, cartOutline,
      // smartcart icons — enregistrés globalement ici
      add, remove, trash,
    });
  }

  ngOnInit() {
    this.loadRecentSearches();
    this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(q => q.trim() ? this.runSearch(q.trim()) : this.clearResults());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Scroll handler — cache le brand après 10px ───────────────────────
  onScroll(event: any) {
    const y = event.detail?.scrollTop ?? 0;
    const shouldBeScrolled = y > 10;
    if (shouldBeScrolled !== this.isScrolled) {
      this.isScrolled = shouldBeScrolled;
      this.cdr.detectChanges();
    }
  }

  // ── Search ────────────────────────────────────────────────────────────
  onSearchFocus() {
    this.searchFocused     = true;
    this.showSearchOverlay = true;
  }

  onSearchBlur() {
    this.searchFocused = false;
  }

  onSearchInput() {
    if (this.searchQuery.length > 0) this.isSearching = true;
    this.searchSubject.next(this.searchQuery);
  }

  onSearchSubmit() {
    const q = this.searchQuery.trim();
    if (!q) return;
    this.saveRecentSearch(q);
    this.runSearch(q);
    this.searchInputRef?.nativeElement.blur();
  }

  clearSearch() {
    this.searchQuery = '';
    this.clearResults();
    this.searchSubject.next('');
    setTimeout(() => this.searchInputRef?.nativeElement.focus(), 0);
  }

  closeOverlay() {
    this.showSearchOverlay = false;
    this.searchFocused     = false;
    this.searchInputRef?.nativeElement.blur();
  }

  applySearch(term: string) {
    this.searchQuery = term;
    this.saveRecentSearch(term);
    this.isSearching = true;
    this.runSearch(term);
  }

  onResultClick(item: SearchResultItem) {
    this.saveRecentSearch(this.searchQuery || item.name);
    this.closeOverlay();
    this.router.navigate([item.route]);
  }

  // ── Core search ───────────────────────────────────────────────────────
  private runSearch(query: string) {
    this.isSearching = true;

    // Log search activity
   

    this.searchService.globalSearch(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.searchResults  = results;
          this.groupedResults = this.groupResults(results);
          this.isSearching    = false;
          this.cdr.detectChanges();
        },
        error: () => this.clearResults(),
      });
  }

  private clearResults() {
    this.searchResults  = [];
    this.groupedResults = [];
    this.isSearching    = false;
  }

  private groupResults(items: SearchResultItem[]): SearchResultGroup[] {
    const map: Record<string, SearchResultGroup> = {
      recipe:   { type:'recipe',   label:'Recettes',   icon:'restaurant-outline', items:[] },
      product:  { type:'product',  label:'Marché',     icon:'cart-outline',       items:[] },
    };
    for (const item of items) map[item.type]?.items.push(item);
    return Object.values(map).filter(g => g.items.length > 0);
  }

  // ── Recent searches ───────────────────────────────────────────────────
  private loadRecentSearches() {
    try {
      const s = localStorage.getItem(RECENT_KEY);
      this.recentSearches = s ? JSON.parse(s) : [];
    } catch { this.recentSearches = []; }
  }

  private saveRecentSearch(term: string) {
    const t = term.trim();
    if (!t) return;
    this.recentSearches = [
      t,
      ...this.recentSearches.filter(s => s.toLowerCase() !== t.toLowerCase()),
    ].slice(0, MAX_RECENT);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(this.recentSearches)); } catch {}
  }

  removeRecent(term: string) {
    this.recentSearches = this.recentSearches.filter(s => s !== term);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(this.recentSearches)); } catch {}
  }

  // ── Navigation ────────────────────────────────────────────────────────
  navigatetoreciepe() { this.router.navigate(['/recipes']); }
  onNotifClick()      { /* TODO: this.router.navigate(['/notifications']); */ }
}