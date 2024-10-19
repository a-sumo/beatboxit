import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Match } from '../match';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  constructor(private http: HttpClient) {}
  searchAudio(file: File): Observable<Match[]> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<Match[]>(`${environment.backendUrl}/search-audio`, formData);
  }
}
