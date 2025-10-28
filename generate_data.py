from faker import Faker
import pandas as pd
import random
import os
from datetime import datetime, timedelta

# Initialize Faker
fake = Faker()

def generate_linkedin_data(num_profiles=10):
    data = []
    
    # Generate some common interests for better matching
    interests = ["Machine Learning", "Web Development", "Data Science", "Product Management", 
                "UX/UI Design", "Cloud Computing", "Cybersecurity", "Blockchain",
                "Artificial Intelligence", "DevOps", "Mobile Development", "Startups"]
    
    for _ in range(num_profiles):
        first_name = fake.first_name()
        last_name = fake.last_name()
        email = f"{first_name.lower()}.{last_name.lower()}@example.com"
        
        # Generate some random interests for each profile
        user_interests = random.sample(interests, k=random.randint(2, 5))
        
        # Generate last active time (within last 7 days)
        last_active = datetime.now() - timedelta(days=random.randint(0, 7), 
                                              hours=random.randint(0, 23),
                                              minutes=random.randint(0, 59))
        
        data.append({
            'id': fake.uuid4(),
            'first_name': first_name,
            'last_name': last_name,
            'email': email,
            'headline': fake.job(),
            'location': fake.city() + ", " + fake.country(),
            'summary': fake.paragraph(nb_sentences=3),
            'experience': "; ".join([fake.job() for _ in range(random.randint(1, 3))]),
            'education': fake.sentence(nb_words=6),
            'skills': ", ".join(fake.words(nb=random.randint(3, 7))),
            'linkedin_url': f"https://www.linkedin.com/in/{first_name.lower()}{last_name.lower()}",
            'prep_notes': fake.paragraph(nb_sentences=2),
            'interests': ", ".join(user_interests),
            'last_active': last_active.isoformat(),
            'is_online': random.choice([True, False, False, False]),  # 25% chance of being online
            'mutual_connections': random.randint(0, 50),
            'chat_available': random.choice([True, True, True, False])  # 75% chance of being available for chat
        })
    
    return pd.DataFrame(data)

def main():
    # Create data directory if it doesn't exist
    os.makedirs('app/data', exist_ok=True)
    
    # Generate and save data
    df = generate_linkedin_data(15)  # Generate 15 profiles
    df.to_csv('app/data/linkedin_profiles.csv', index=False)
    print("Generated LinkedIn profiles data at app/data/linkedin_profiles.csv")

if __name__ == "__main__":
    main()
