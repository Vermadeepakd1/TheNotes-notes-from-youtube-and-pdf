import { Link } from "react-router-dom";

const contentMap = {
  help: {
    label: "Help Center",
    title: "How TheNotes works",
    body: [
      "Upload a PDF or paste a YouTube URL from the dashboard.",
      "The backend extracts content, sends it to Gemini, and stores the generated note in MongoDB.",
      "You can revisit notes from the library, archive completed work, and share a saved note with a public link.",
    ],
  },
  privacy: {
    label: "Privacy",
    title: "Privacy overview",
    body: [
      "Uploaded material is processed to generate structured notes for your account.",
      "Shared links expose only the note you explicitly share, not your account data.",
      "For production deployment, move secrets to environment variables and rotate them regularly.",
    ],
  },
  terms: {
    label: "Terms",
    title: "Usage terms",
    body: [
      "Use the application only with content you have permission to process.",
      "Generated notes are study aids and should be reviewed before academic submission.",
      "Keep credentials private and avoid uploading sensitive documents to shared environments.",
    ],
  },
};

export default function StaticInfoPage({ type }) {
  const content = contentMap[type];

  return (
    <div className="min-h-screen bg-surface p-6 lg:p-8">
      <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-8 shadow-curator sm:p-10">
        <Link to="/" className="text-sm font-semibold text-primary hover:underline">
          Back to home
        </Link>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-secondary">
          {content.label}
        </p>
        <h1 className="mt-3 font-headline text-4xl font-extrabold text-primary">
          {content.title}
        </h1>

        <div className="mt-8 space-y-4">
          {content.body.map((paragraph) => (
            <p key={paragraph} className="text-sm leading-8 text-on-surface-variant">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
