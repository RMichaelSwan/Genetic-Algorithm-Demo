//TODO add console output window/log to browser display
//TODO add some user options for obstacles, start position, goal position, swarm size, etc. along with some neat presets.
//TODO improve evolutionary algorithm and/or add options for different variations (e.g. allowing longer lived mutations)
//TODO improve collision system to detect any movement that would phase through an obstacle

let defaultWidth = 1200
let defaultHeight = 800
let scaleRatioWH = defaultWidth/defaultHeight

let widthSet = defaultWidth
let heightSet = defaultHeight
let scale = 1 //scale
let obstacles = []

function scaleSetup()
{
  if (windowWidth/windowHeight > scaleRatioWH)
  {
    heightSet = windowHeight
    widthSet = heightSet * scaleRatioWH
  }
  else
  {
    widthSet = windowWidth
    heightSet = widthSet / scaleRatioWH
  }
  scale = widthSet / defaultWidth
}

function setup()
{
  scaleSetup()
  createCanvas(widthSet, heightSet);
  print("Scaled to ", widthSet, "x", heightSet, "with size scaling of ", scale)


  goal = new Goal(scale*600,scale*10);
  obstacles.push(new Obstacle(scale*180,scale*380,scale*680,scale*20));
  obstacles.push(new Obstacle(scale*800,scale*500,scale*300,scale*20));
  obstacles.push(new Obstacle(0,scale*200,scale*150,scale*20));
  obstacles.push(new Obstacle(scale*630,scale*70,scale*200,scale*150));
  obstacles.push(new Obstacle(scale*450,0,scale*70,scale*110));
  test = new Population(200, goal);
}
function draw()
{
  background(255);
  goal.show();
  for (let i = 0, len = obstacles.length; i < len; i++)
  {
    obstacles[i].show()
  }
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
    this.pos = createVector(width/2,height-10); //default start is center bottom of screen
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
    //if velocity is too high, our rudimentary collision system begins to fail.
    this.vel.limit(15*scale); 
    this.pos.add(this.vel);
  }

  ObstacleCollided()
  {
    let obs_pos, obs_size, upperX, upperY
    for(let i=0, len=obstacles.length; i < len; i++)
    {
      obs_pos = obstacles[i].pos
      obs_size = obstacles[i].size
      upperX = obs_pos.x + obs_size.x
      upperY = obs_pos.y + obs_size.y
      if(this.pos.x > obs_pos.x && this.pos.x < upperX &&
         this.pos.y > obs_pos.y && this.pos.y < upperY)
      {
        return true;
      }
    }
    return false
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
      else if(this.ObstacleCollided())
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