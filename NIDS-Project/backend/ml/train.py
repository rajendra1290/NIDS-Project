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

TRAIN_PATH = '../../dataset/kddtrain.csv'
TEST_PATH  = '../../dataset/kddtest.csv'

def train_model():
    X_train, y_train, X_test, y_test = load_and_preprocess(
        TRAIN_PATH, TEST_PATH
    )

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
    import numpy as np
    unique_classes = np.unique(y_test)
    target_names = ['Normal', 'Attack']
    labels_present = [target_names[i] for i in unique_classes]

    print(classification_report(
    y_test, y_pred,
    labels=unique_classes,
    target_names=labels_present
))
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(6, 4))
    sns.heatmap(cm, annot=True, fmt='d',
                cmap='Reds',
                xticklabels=['Normal','Attack'],
                yticklabels=['Normal','Attack'])
    plt.title('Confusion Matrix')
    plt.ylabel('Actual')
    plt.xlabel('Predicted')
    os.makedirs('saved', exist_ok=True)
    plt.savefig('saved/confusion_matrix.png')
    print("📈 Confusion matrix saved!")

    joblib.dump(model, 'saved/model.pkl')
    print("💾 Model saved → ml/saved/model.pkl")

if __name__ == "__main__":
    train_model()
