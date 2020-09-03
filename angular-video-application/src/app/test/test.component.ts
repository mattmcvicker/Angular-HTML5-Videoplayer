import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap, Data } from '@angular/router';
import {DataService} from '../data.service';


@Component({
  selector: 'app-test',
  template: `
  <div>
    <input #box (keyup.enter)="onEnter(box.value)">
  </div>`,
    
  styleUrls: ['./test.component.css']
})

export class TestComponent implements OnInit {
  fileName: string
  
  constructor(
    private route: ActivatedRoute,
    private dataService: DataService
  ) { }

  ngOnInit(): void {
    
  }

  onEnter(word) {
    console.log(word)
    this.fileName = word;
    this.dataService.fileData = word;
  }

  


}



