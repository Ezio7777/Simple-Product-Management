from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import Product
from database import SessionLocal, engine
from sqlalchemy.orm import Session
import database_models
from ai_handler import get_warehouse_advice

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

database_models.Base.metadata.create_all(bind=engine)

products = [
    Product(id=1, name="Smartphone", description="Latest model with 5G support", price=699.99, quantity=12),
    Product(id=2, name="Laptop", description="High-performance for gaming and work", price=1200.50, quantity=7),
]

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    db = SessionLocal()

    count = db.query(database_models.Product).count

    if count == 0:
        for product in products:
            db.add(database_models.Product(**product.model_dump()))
        db.commit()


init_db()

@app.get("/")
def greet():
    return "Hello Buddy"


@app.get("/products")
def get_all_products(db:Session = Depends(get_db)):

    db_products = db.query(database_models.Product).all()
    return db_products 


@app.get("/products/{id}")
def get_product_by_id(id:int, db:Session = Depends(get_db)):
    db_product = db.query(database_models.Product).filter(database_models.Product.id == id).first()
    if db_product:
        return db_product
        
    return "Product Not Found"
        

@app.post("/products")
def add_product(product: Product, db:Session = Depends(get_db)):
    db.add(database_models.Product(**product.model_dump()))
    db.commit()
    return product


@app.put("/products/{id}")
def update_product(id : int, product: Product, db:Session = Depends(get_db)):
    db_product = db.query(database_models.Product).filter(database_models.Product.id == id).first()
    if db_product :
        db_product.name = product.name
        db_product.description = product.description
        db_product.price = product.price
        db_product.quantity = product.quantity
        db.commit()
        return "Success Fully Updated"
    else:
        return "Product Not Found"   
    
 
@app.delete("/products/{id}") 
def delete_product(id:int, db:Session = Depends(get_db)):
    db_product = db.query(database_models.Product).filter(database_models.Product.id == id).first()
    if db_product :
        db.delete(db_product)
        db.commit()
        return "Success Fully Deleted"
    else:
        return "Product Not Found"    
    

@app.post("/ai/chat")
def chat_with_inventory(request: dict, db: Session = Depends(get_db)):
    user_message = request.get("message")

    all_products = db.query(database_models.Product).all()

    inventory_context = [
        {"name": p.name, "quantity": p.quantity, "price": p.price} 
        for p in all_products
    ]

    ai_response = get_warehouse_advice(user_message, inventory_context)
    
    return {"reply": ai_response}