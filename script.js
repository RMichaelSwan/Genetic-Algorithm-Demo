//TODO add console output window/log to browser display
//TODO add some user options for obstacles, start position, goal position, swarm size, etc. along with some neat presets.
//TODO add scaling to handle any browser size

function setup()
{
  createCanvas(1200, 800);
  
  goal = new Goal(600,10);
  obs = new Obstacle(180,380,680,20);
  obs2 = new Obstacle(800,500,300,20);
  obs3 = new Obstacle(0,200,150,20);
  obs4 = new Obstacle(630,70,200,150);
  obs5 = new Obstacle(450,0,70,110);
  test = new Population(1000, goal);
}
function draw()
{
  background(255);
  goal.show();
  obs.show();
  obs2.show();
  obs3.show();
  obs4.show();
  obs5.show();
  if (test.allDotsDead())
  {
    test.calculateFitness();
    test.naturalSelection();
    test.mutateDots();
  }
  else
  {
    test.update();
    test.show();
  }
}

class Obstacle
{  
  constructor(posX, posY,sizeX, sizeY)
  {
    this.pos = createVector(posX,posY);
    this.size = createVector(sizeX,sizeY);
  }
  
  show()
  {
    fill(0,0,255);
    rect(this.pos.x,this.pos.y,this.size.x, this.size.y); 
  }
  
}

class Goal
{  
  constructor(x, y)
  {
    this.pos = createVector(x,y);
  }
  
  show()
  {
    fill(255,0,0);
    ellipse(this.pos.x, this.pos.y, 10,10);    
  }
}


class Brain
{
  
  
  constructor(size)
  {
    this.directions = []
    this.step = 0

    for (let i = 0; i < size; i++)
    {
      let randomAngle = random(2*PI);
      this.directions.push(p5.Vector.fromAngle(randomAngle))
    }
  }
  
  clone()
  {
    let clone = new Brain(this.directions.length);    
    for(let i = 0; i<this.directions.length; i++)
    {
      clone.directions[i] = this.directions[i].copy(); 
    }
    return clone;
  }
  
  mutate()
  {
    let mutationRate = 0.01;
    let rand, randomAngle;
    for(let i = 0; i<this.directions.length; i++) //starts at one to account for "best" of last gen
    {
      rand = random(1);
      if(rand < mutationRate)
      {
        //TODO - only change direction slightly instead of setting completely random number
        randomAngle = random(2*PI);
        this.directions[i] = p5.Vector.fromAngle(randomAngle);
      }
    }
  }
  
}



class Dot
{
  constructor(goal)
  {
    this.dead = false;
    this.reachedGoal = false;
    this.isBest = false;
    this.fitness = 0.0;

    this.brain = new Brain(400);
    this.pos = createVector(width/2,height-10);
    this.vel = createVector(0,0);
    this.acc = createVector(0,0);
    this.finish = goal; //should be a Goal object
  }

  show()
  {
    if(this.isBest)
    {
      fill(0,255,0);
      ellipse(this.pos.x,this.pos.y,8,8);
    }
    else
    {
      fill(0);
      ellipse(this.pos.x,this.pos.y,4,4);
    }
  }

  move()
  {
    if(this.brain.directions.length > this.brain.step)
    {
      this.acc = this.brain.directions[this.brain.step];
      this.brain.step++;
    }
    else
    {
      this.dead = true; 
    }
    this.vel.add(this.acc);
    this.vel.limit(15);
    this.pos.add(this.vel);
  }

  update()
  {
    if (!this.dead && !this.reachedGoal)
    {
      this.move();
      if(this.pos.x < 2 || this.pos.y < 2 || this.pos.x>width-2 || this.pos.y > height-2)
      {
        this.dead = true;
      }
      else if(dist(this.pos.x,this.pos.y,this.finish.pos.x,this.finish.pos.y) < 5)
      {
        this.reachedGoal = true;
      }
      else if((this.pos.x > 180 && this.pos.x < 860 && this.pos.y > 380  && this.pos.y < 400) ||
              (this.pos.x > 800 && this.pos.x < 1100 && this.pos.y > 500  && this.pos.y < 520) ||
              (this.pos.x > 0 && this.pos.x < 150 && this.pos.y > 200  && this.pos.y < 220) ||
              (this.pos.x > 630 && this.pos.x < 830 && this.pos.y > 70  && this.pos.y < 220) ||
              (this.pos.x > 450 && this.pos.x < 520 && this.pos.y > 0  && this.pos.y < 110)) //TODO move this to a standarized obstacle collision check
      {
        this.dead = true;        
      }
    }

  }

  calculateFitness()
  {
    if(this.reachedGoal)
    {
      this.fitness = 1.0/16 + 10000.0/(this.brain.step * this.brain.step);
    }
    else
    {
      let distanceToGoal = dist(this.pos.x, this.pos.y, this.finish.pos.x, this.finish.pos.y);
      this.fitness = 1.0/(distanceToGoal * distanceToGoal);
    }
  }
  
  //TODO mate this with another parent instead of asexual reproduction
  createBaby()
  {
    let baby = new Dot(this.finish);
    baby.brain = this.brain.clone();
    return baby;
  }
}



class Population
{  
  constructor(size, goal)
  {
    this.dots = [];
    this.finish = goal;
    this.fitnessSum = 0.0;
    this.generation = 1;
    this.bestDot = 0;
    this.minStep = 400;

    for(let i = 0; i < size; i++)
    {
      this.dots[i] = new Dot(goal); //goal should be a Goal object     
    }
  }
  
  
  show()
  {
    for(let i = 0; i<this.dots.length; i++)
    {
      this.dots[i].show(); 
    }
  }  
  
  update()
  {
    for(let i = 0; i<this.dots.length; i++)
    {
      if(this.dots[i].brain.step > this.minStep)
      {
        this.dots[i].dead = true;
      }
      else
      {
        this.dots[i].update();
      }
    }
  }  
  
  calculateFitness()
  {
    for(let i = 0; i<this.dots.length; i++)
    {
      this.dots[i].calculateFitness(); 
    }
  }
  
  allDotsDead()
  {
    for(let i = 0; i<this.dots.length; i++)
    {
      if(!this.dots[i].dead && !this.dots[i].reachedGoal)
      {
        return false;                
      }
    }
    return true;
  }
  
  naturalSelection()
  {
    let newDots = [];
    this.setBestDot();
    this.calculateFitnessSum();
    
    newDots[0] = this.dots[this.bestDot].createBaby();
    newDots[0].isBest = true;
    for (let i = 1; i < this.dots.length; i++)
    {
      //select fit parents
      let parent = this.selectParent();
      
      //get baby
      newDots[i] = parent.createBaby();
    }
    
    this.dots = newDots;
    this.generation++;
  }
  
  calculateFitnessSum()
  {
    this.fitnessSum = 0;
    for(let i = 0; i<this.dots.length; i++)
    {
      this.fitnessSum += this.dots[i].fitness; 
    }
  }
  
  selectParent()
  {
    let rand = random(this.fitnessSum);
    
    let runningSum = 0;
    for(let i = 0; i<this.dots.length; i++)
    {
      runningSum += this.dots[i].fitness;
      if (runningSum > rand)
      {
        return this.dots[i];        
      }
    }
    
    return null; //should never get here.
  }
  
  mutateDots()
  {
    for(let i = 1; i<this.dots.length; i++)
    {
      this.dots[i].brain.mutate();
    }
  }
  
  setBestDot()
  {
    let max = 0;
    let maxIndex = 0;
    for(let i = 0; i<this.dots.length; i++)
    {
      if(this.dots[i].fitness > max)
      {
        max = this.dots[i].fitness;
        maxIndex = i;
      }
    }
    this.bestDot = maxIndex;
    
    if(this.dots[this.bestDot].reachedGoal)
    {
      this.minStep = this.dots[this.bestDot].brain.step;
      print("step:",this.minStep, " Gen: ",this.generation);
    }
    else
    {
      print("generation ", this.generation, " failure."); 
    }
  }
}