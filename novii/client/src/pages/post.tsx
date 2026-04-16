import Layout from "@/components/layout";
import { useLocation } from "wouter";
import { usePost } from "@/hooks/use-data";
import { Spinner } from "@/components/ui/spinner";
import { PostViewerModal } from "@/components/post-viewer-modal";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language-context";

export default function PostPage() {
  const [location, navigate] = useLocation();
  const { language } = useLanguage();
  const isRTL = language.code === 'ar';
  
  // Extract post ID from URL
  const match = location.match(/\/post\/([^?]+)/);
  const postId = match ? match[1] : null;
  
  const { data: post, isLoading } = usePost(postId || "");
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        navigate('/');
      }
    }
  };

  if (!postId) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Invalid post</p>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner className="w-8 h-8" />
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">{isRTL ? 'لم يتم العثور على المنشور' : 'Post not found'}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PostViewerModal
        post={post}
        open={isModalOpen}
        onOpenChange={handleOpenChange}
        isRTL={isRTL}
      />
    </Layout>
  );
}
