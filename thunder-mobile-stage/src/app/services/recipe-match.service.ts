import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Recipe, DishAnalysis } from '../models/reciepe.model';
 
@Injectable({ providedIn: 'root' })
export class RecipeMatchService {
 
  private readonly apiUrl = environment.apiUrl;
  private cache: Recipe[] = [];
 
  constructor(private http: HttpClient) {}
 
  // Charge toutes les recettes depuis Laravel
  async loadRecipes(): Promise<Recipe[]> {
    if (this.cache.length) return this.cache;
    try {
      const res = await firstValueFrom(this.http.get<any>(`${this.apiUrl}/recipes`));
      this.cache = Array.isArray(res) ? res : (res.data || res.recipes || []);
      return this.cache;
    } catch { return []; }
  }
 
  // Trouve la meilleure recette pour l'analyse donnée (seuil : 40%)
  async findMatch(analysis: DishAnalysis): Promise<Recipe | null> {
    const recipes = await this.loadRecipes();
    if (!recipes.length) return null;
 
    const scored = recipes.map(r => ({ r, score: this.score(analysis, r) }));
    scored.sort((a, b) => b.score - a.score);
 
    if (scored[0].score >= 40) {
      scored[0].r.matchScore = scored[0].score;
      scored[0].r.source = 'database';
      return scored[0].r;
    }
    return null;
  }
 
  private score(analysis: DishAnalysis, recipe: Recipe): number {
    let s = 0;
 
    // Nom du plat (40%)
    const nameScore = this.nameSim(
      analysis.dishName.toLowerCase(),
      (recipe.nom || '').toLowerCase()
    );
    s += nameScore * 40;
 
    // Ingrédients (60%)
    const detected = analysis.ingredients
      .filter(i => i.probability >= 0.5)
      .map(i => this.norm(i.name));
 
    const recipeIngr = this.extractIngr(recipe).map(n => this.norm(n));
 
    if (detected.length && recipeIngr.length) {
      const matched = detected.filter(d =>
        recipeIngr.some(r => r.includes(d) || d.includes(r))
      );
      const union = new Set([...detected, ...recipeIngr]).size;
      const iou = matched.length / union;
      const cov = matched.length / detected.length;
      s += (0.5 * iou + 0.5 * cov) * 60;
    }
 
    return Math.round(s * 10) / 10;
  }
 
  private nameSim(a: string, b: string): number {
    if (a === b) return 1;
    if (a.includes(b) || b.includes(a)) return 0.8;
    const wa = a.split(' '), wb = b.split(' ');
    const common = wa.filter(w => w.length > 3 && wb.some(x => x.includes(w) || w.includes(x)));
    return common.length / Math.max(wa.length, wb.length);
  }
 
  private norm(s: string): string {
    return s.toLowerCase().trim()
      .replace(/\b(frais|fraîche|séché|haché|émincé|cuit|de|du|la|le|les|un|une|des)\b/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
 
  private extractIngr(recipe: Recipe): string[] {
    const raw = recipe.ingredients;
    if (!raw) return [];
    let arr = typeof raw === 'string' ? this.tryParse(raw) : raw;
    if (!Array.isArray(arr)) return [];
    return arr.map((i: any) => (typeof i === 'string' ? i : (i.nom || i.name || ''))).filter(Boolean);
  }
 
  private tryParse(s: string): any {
    try { return JSON.parse(s); } catch { return s.split(/[\n,;]+/).map(x => x.trim()).filter(Boolean); }
  }
}