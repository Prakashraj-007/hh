import pandas as pd
import numpy as np
import json
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import os

# 1. Load Data
df = pd.read_csv('dataset.csv')

# 2. Preprocessing
# Target variable
df['is_returned'] = (df['Return_Status'] == 'Returned').astype(int)

# Fill missing Days_to_Return with 0 for non-returned items
df['Days_to_Return'] = df['Days_to_Return'].fillna(0)

# 3. Network Security Analysis (IP Address)
# Calculate return rate per IP
ip_stats = df.groupby('IP_Address').agg(
    total_orders=('Order_ID', 'count'),
    total_returns=('is_returned', 'sum'),
    unique_users=('User_ID', 'nunique')
).reset_index()

ip_stats['ip_return_rate'] = ip_stats['total_returns'] / ip_stats['total_orders']
ip_stats['ip_risk_score'] = (ip_stats['ip_return_rate'] * 0.7) + (np.clip(ip_stats['unique_users'] / 5, 0, 1) * 0.3)

# Create lookup maps
ip_risk_map = dict(zip(ip_stats['IP_Address'], ip_stats['ip_risk_score']))
ip_density_map = dict(zip(ip_stats['IP_Address'], ip_stats['unique_users']))

# 4. Behavioral Feature Analysis
def get_risk_map(column):
    stats = df.groupby(column)['is_returned'].mean().to_dict()
    return stats

category_risk = get_risk_map('Product_Category')
reason_risk = get_risk_map('Return_Reason')
location_risk = get_risk_map('User_Location')
payment_risk = get_risk_map('Payment_Method')
shipping_risk = get_risk_map('Shipping_Method')

# 5. Global Thresholds
thresholds = {
    "avg_days_to_return": float(df[df['is_returned'] == 1]['Days_to_Return'].mean()),
    "avg_product_price": float(df['Product_Price'].mean()),
    "avg_discount": float(df['Discount_Applied'].mean()),
    "high_risk_ip_threshold": 0.6,
    "shared_ip_threshold": 3
}

# 6. Export Results
model_data = {
    "category_risk": category_risk,
    "reason_risk": reason_risk,
    "location_risk": location_risk,
    "payment_risk": payment_risk,
    "shipping_risk": shipping_risk,
    "ip_risk_map": {k: float(v) for k, v in ip_risk_map.items() if v > 0.4}, # Only export high risk IPs to keep JSON small
    "ip_density_map": {k: int(v) for k, v in ip_density_map.items() if v > 2},
    "thresholds": thresholds
}

os.makedirs('src/data', exist_ok=True)
with open('src/data/model_thresholds.json', 'w') as f:
    json.dump(model_data, f, indent=2)

print("Training and network analysis complete. Model thresholds exported to src/data/model_thresholds.json")
