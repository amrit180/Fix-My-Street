"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/lib/context/AuthContext";
import { IssueCategory, ISSUE_CATEGORIES } from "@/lib/types";
import { Loader } from "@googlemaps/js-api-loader";
import Navbar from "@/components/Navbar";

const PATNA_CENTER = { lat: 25.5941, lng: 85.1376 };

export default function ReportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "pothole" as IssueCategory,
    latitude: PATNA_CENTER.lat,
    longitude: PATNA_CENTER.lng,
    photo: null as File | null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize map
  useEffect(() => {
    let cancelled = false;

    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        version: "weekly",
      });

      const { Map: MapConstructor } = await loader.importLibrary("maps");
      const maps = (window as unknown as { google?: { maps?: any } }).google
        ?.maps;
      const MarkerCtor = maps?.Marker;
      if (!MarkerCtor) {
        if (!cancelled) {
          setError("Map failed to load. Check your Google Maps API key.");
        }
        return;
      }

      if (cancelled || !mapRef.current || googleMapRef.current) return;

      googleMapRef.current = new MapConstructor(mapRef.current, {
        zoom: 14,
        center: PATNA_CENTER,
        mapTypeId: "roadmap",
      });

      const marker = new MarkerCtor({
        position: PATNA_CENTER,
        map: googleMapRef.current,
        draggable: true,
        title: "Drag to set location",
      });

      marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        if (pos) {
          setFormData((prev) => ({
            ...prev,
            latitude: pos.lat(),
            longitude: pos.lng(),
          }));
        }
      });

      googleMapRef.current.addListener("click", (e: any) => {
        if (e.latLng) {
          marker.setPosition(e.latLng);
          setFormData((prev) => ({
            ...prev,
            latitude: e.latLng.lat(),
            longitude: e.latLng.lng(),
          }));
        }
      });

      markerRef.current = marker;

      if (cancelled) {
        marker.setMap(null);
        googleMapRef.current = null;
        markerRef.current = null;
      }
    };

    initMap();

    return () => {
      cancelled = true;
      markerRef.current?.setMap(null);
      markerRef.current = null;
      const map = googleMapRef.current;
      googleMapRef.current = null;
      const g = (
        window as unknown as {
          google?: {
            maps?: { event?: { clearInstanceListeners: (x: unknown) => void } };
          };
        }
      ).google;
      if (map && g?.maps?.event) {
        g.maps.event.clearInstanceListeners(map);
      }
      if (mapRef.current) {
        mapRef.current.innerHTML = "";
      }
    };
  }, []);

  const generateUniqueId = async (): Promise<string> => {
    const issuesRef = collection(db, "issues");
    const q = query(issuesRef, orderBy("createdAt", "desc"), limit(1));
    const snapshot = await getDocs(q);

    let lastNumber = 0;
    if (!snapshot.empty) {
      const lastId = snapshot.docs[0].data().uniqueId;
      const match = lastId.match(/PTN-\d+-(\d+)/);
      if (match) {
        lastNumber = parseInt(match[1], 10);
      }
    }

    const year = new Date().getFullYear();
    return `PTN-${year}-${String(lastNumber + 1).padStart(4, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      let photoUrl = "";
      if (formData.photo) {
        if (formData.photo.size > 5 * 1024 * 1024) {
          throw new Error("Photo must be less than 5MB");
        }

        const storageRef = ref(
          storage,
          `issues/${Date.now()}-${formData.photo.name}`,
        );
        const snapshot = await uploadBytes(storageRef, formData.photo);
        photoUrl = await getDownloadURL(snapshot.ref);
      }

      const uniqueId = await generateUniqueId();

      const issueData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        latitude: formData.latitude,
        longitude: formData.longitude,
        photoUrl,
        status: "Reported",
        reporterId: user.id,
        reporterName: user.name,
        upvotes: 0,
        upvoters: [],
        ward: 18, // Default ward, can be calculated from coordinates
        createdAt: new Date(),
        updatedAt: new Date(),
        uniqueId,
      };

      await addDoc(collection(db, "issues"), issueData);

      router.push("/my-reports?success=Issue reported successfully");
    } catch (err: any) {
      setError(err.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Report an Issue
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Issue Title
              </label>
              <input
                type="text"
                maxLength={200}
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                placeholder="Brief title (e.g., Pothole on Main Street)"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as IssueCategory,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
              >
                {ISSUE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Description (max 300 characters)
            </label>
            <textarea
              maxLength={300}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 h-24 resize-none"
              placeholder="Describe the issue in detail..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/300 characters
            </p>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Photo (max 5MB)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 5 * 1024 * 1024) {
                    setError("Photo must be less than 5MB");
                  } else if (!["image/jpeg", "image/png"].includes(file.type)) {
                    setError("Only JPEG and PNG files are allowed");
                  } else {
                    setFormData({ ...formData, photo: file });
                    setError("");
                  }
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Location (click or drag marker on map)
            </label>
            <div
              ref={mapRef}
              className="w-full h-96 rounded-lg border border-gray-300 overflow-hidden"
            />
            <p className="text-xs text-gray-500 mt-2">
              Coordinates: {formData.latitude.toFixed(4)},{" "}
              {formData.longitude.toFixed(4)}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Submitting..." : "Submit Report"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
