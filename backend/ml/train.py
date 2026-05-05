import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, classification_report,
    confusion_matrix
)
import joblib
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from preprocess import load_and_preprocess

TRAIN_PATH = '../../dataset/KDDTrain+.txt'
TEST_PATH  = '../../dataset/KDDTest+.txt'

def train_model():
    X_train, y_train, X_test, y_test = load_and_preprocess(
        TRAIN_PATH, TEST_PATH
    )

    # Verify both classes exist
    print(f"🔍 y_train classes: {np.unique(y_train)}")
    print(f"🔍 y_test  classes: {np.unique(y_test)}")

    print("\n🧠 Training Random Forest model...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=15,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1,
        verbose=1
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc    = accuracy_score(y_test, y_pred)

    print(f"\n{'='*50}")
    print(f"✅ Accuracy : {acc * 100:.2f}%")
    print(f"{'='*50}")
    print("\n📊 Classification Report:")

    # Safe classification report
    unique_classes = np.unique(np.concatenate([y_test, y_pred]))
    names = {0: 'Normal', 1: 'Attack'}
    target_names = [names[c] for c in unique_classes]
    print(classification_report(
        y_test, y_pred,
        labels=unique_classes,
        target_names=target_names
    ))

    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(6, 4))
    sns.heatmap(cm, annot=True, fmt='d',
                cmap='Reds',
                xticklabels=target_names,
                yticklabels=target_names)
    plt.title('Confusion Matrix')
    plt.ylabel('Actual')
    plt.xlabel('Predicted')
    os.makedirs('saved', exist_ok=True)
    plt.savefig('saved/confusion_matrix.png')
    print("📈 Confusion matrix saved!")

    joblib.dump(model, 'saved/model.pkl')
    print("💾 Model saved → ml/saved/model.pkl")
    print("\n🎉 Training complete!")

if __name__ == "__main__":
    train_model()
