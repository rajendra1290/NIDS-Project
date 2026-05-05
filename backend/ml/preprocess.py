import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib
import os

# NSL-KDD Column names (42 features + difficulty)
COLUMNS = [
    'duration','protocol_type','service','flag',
    'src_bytes','dst_bytes','land','wrong_fragment',
    'urgent','hot','num_failed_logins','logged_in',
    'num_compromised','root_shell','su_attempted',
    'num_root','num_file_creations','num_shells',
    'num_access_files','num_outbound_cmds',
    'is_host_login','is_guest_login','count',
    'srv_count','serror_rate','srv_serror_rate',
    'rerror_rate','srv_rerror_rate','same_srv_rate',
    'diff_srv_rate','srv_diff_host_rate',
    'dst_host_count','dst_host_srv_count',
    'dst_host_same_srv_rate','dst_host_diff_srv_rate',
    'dst_host_same_src_port_rate',
    'dst_host_srv_diff_host_rate',
    'dst_host_serror_rate','dst_host_srv_serror_rate',
    'dst_host_rerror_rate','dst_host_srv_rerror_rate',
    'label', 'difficulty'
]

CAT_COLS = ['protocol_type', 'service', 'flag']

def load_and_preprocess(train_path, test_path):
    print("📂 Loading NSL-KDD dataset...")

    train = pd.read_csv(train_path, names=COLUMNS)
    test  = pd.read_csv(test_path,  names=COLUMNS)

    # Drop difficulty column (NSL-KDD specific)
    train = train.drop('difficulty', axis=1, errors='ignore')
    test  = test.drop('difficulty',  axis=1, errors='ignore')

    # Clean labels — convert to string, strip dots/spaces
    train['label'] = train['label'].astype(str).str.strip().str.rstrip('.')
    test['label']  = test['label'].astype(str).str.strip().str.rstrip('.')

    print(f"\n📊 Train label distribution (top 10):")
    print(train['label'].value_counts().head(10))
    print(f"\n📊 Test label distribution (top 10):")
    print(test['label'].value_counts().head(10))

    # Binary: normal=0, attack=1
    train['label'] = train['label'].apply(
        lambda x: 0 if x.lower() == 'normal' else 1)
    test['label'] = test['label'].apply(
        lambda x: 0 if x.lower() == 'normal' else 1)

    print(f"\n✅ Train — Normal: {(train['label']==0).sum()}, "
          f"Attack: {(train['label']==1).sum()}")
    print(f"✅ Test  — Normal: {(test['label']==0).sum()}, "
          f"Attack: {(test['label']==1).sum()}")

    # Encode categorical columns
    encoders = {}
    for col in CAT_COLS:
        le = LabelEncoder()
        train[col] = le.fit_transform(train[col].astype(str))
        test[col]  = test[col].astype(str).apply(
            lambda x: x if x in le.classes_ else le.classes_[0])
        test[col]  = le.transform(test[col])
        encoders[col] = le

    # Split features and labels
    X_train = train.drop('label', axis=1).values
    y_train = train['label'].values
    X_test  = test.drop('label', axis=1).values
    y_test  = test['label'].values

    # Scale features
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test  = scaler.transform(X_test)

    # Save scaler and encoders
    os.makedirs('saved', exist_ok=True)
    joblib.dump(scaler,   'saved/scaler.pkl')
    joblib.dump(encoders, 'saved/encoders.pkl')

    print(f"\n✅ Train samples: {len(X_train)}")
    print(f"✅ Test  samples: {len(X_test)}")
    print("✅ Preprocessing complete!\n")

    return X_train, y_train, X_test, y_test
