import express, { Express, Request, Response } from 'express';

const app: Express = express();
const port = process.env.PORT || 3000;

interface UserQueryState {
  location: string;
  cuisine: string;
  specificFoodItems: string;
  priceRange: string;
  distance: string;
  time: string;
}
interface RestaurantCandidate {
  restaurants: Restaurant[];
}

interface TimeWindow {
  start: string;
  end: string;
}

interface Restaurant {
  address: string;
  cuisine: string;
  priceRange: string;
  rating: string;
  distance: string;
  time: TimeWindow[];
  menuItems: string[];
}


app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 


