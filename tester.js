class Shot {
    
    /*static initialize(x, y, id, xm, ym) {
      this.xm = xm;
      this.ym = ym;
      while (this.xm * this.xm + this.ym * this.ym > 1.2 || this.xm * this.xm + this.ym * this.ym < 1) {
        if (this.xm * this.xm + this.ym * this.ym > 1.1) {
          this.xm /= 1.01;
          this.ym /= 1.01;
        }
        if (this.xm * this.xm + this.ym * this.ym < 1.1) {
          this.xm *= 1.01;
          this.ym *= 1.01;
        }
      }
      this.xm = this.xm * 10;
      this.ym = this.ym * 10;
      this.y = y;
      this.x = x;
      while ((this.x < x + 40 && this.x > x - 40) && (this.y < y + 40 && this.y > y - 40)) {	
        this.x = this.x + xm;	
        this.y = this.y + ym;	
      }	
      this.counter = 0;	
      this.id = id;     	
    }*/
    static initialize() {
    }
    static draw() {	
      draw.fillStyle = "#000000";
      draw.fillRect(this.x, this.y, 5, 5);
    }
    
    /*static update() {
      if (this.counter == 1) {
        this.x += this.xm;
        this.y += this.ym;
        this.counter = 0;
      } else {
        this.counter++;
      }
    }*/
    
  }
