"""
MindMate AI - Pinecone Client
Pinecone vector database client setup and management.
"""

import logging
from typing import Optional, List, Dict, Any
from contextlib import contextmanager

from pinecone import Pinecone, ServerlessSpec, PodSpec
from pinecone.exceptions import PineconeApiException, NotFoundException

from config import config, PineconeConfig

logger = logging.getLogger(__name__)


class PineconeClient:
    """
    Pinecone vector database client for MindMate AI memory service.
    
    Handles connection management, index operations, and vector storage/retrieval.
    """
    
    _instance: Optional["PineconeClient"] = None
    _client: Optional[Pinecone] = None
    _index: Optional[Any] = None
    
    def __new__(cls) -> "PineconeClient":
        """Singleton pattern for Pinecone client."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize Pinecone client with configuration."""
        if self._client is not None:
            return
        
        self.cfg: PineconeConfig = config.pinecone
        self._initialize_client()
    
    def _initialize_client(self) -> None:
        """Initialize the Pinecone client connection."""
        try:
            self._client = Pinecone(api_key=self.cfg.api_key)
            logger.info("Pinecone client initialized successfully")
            
            # Ensure index exists
            self._ensure_index()
            
            # Connect to index
            self._index = self._client.Index(self.cfg.index_name)
            logger.info(f"Connected to Pinecone index: {self.cfg.index_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Pinecone client: {e}")
            raise
    
    def _ensure_index(self) -> None:
        """Ensure the Pinecone index exists, create if not."""
        try:
            # List existing indexes
            existing_indexes = [idx.name for idx in self._client.list_indexes()]
            
            if self.cfg.index_name not in existing_indexes:
                logger.info(f"Creating Pinecone index: {self.cfg.index_name}")
                
                # Use serverless spec for new indexes
                spec = ServerlessSpec(
                    cloud=self.cfg.cloud,
                    region=self.cfg.region
                )
                
                self._client.create_index(
                    name=self.cfg.index_name,
                    dimension=self.cfg.dimension,
                    metric=self.cfg.metric,
                    spec=spec
                )
                logger.info(f"Created index: {self.cfg.index_name}")
            else:
                logger.info(f"Index already exists: {self.cfg.index_name}")
                
        except Exception as e:
            logger.error(f"Failed to ensure index: {e}")
            raise
    
    @property
    def client(self) -> Pinecone:
        """Get the Pinecone client instance."""
        if self._client is None:
            self._initialize_client()
        return self._client
    
    @property
    def index(self) -> Any:
        """Get the Pinecone index instance."""
        if self._index is None:
            self._initialize_client()
        return self._index
    
    def get_namespace(self, user_id: str) -> str:
        """Generate namespace for a user."""
        return f"{self.cfg.namespace_prefix}_{user_id}"
    
    def upsert_vectors(
        self,
        vectors: List[Dict[str, Any]],
        namespace: str,
        batch_size: int = 100
    ) -> Dict[str, Any]:
        """
        Upsert vectors in batches.
        
        Args:
            vectors: List of vector records to upsert
            namespace: Namespace for the vectors
            batch_size: Number of vectors per batch
            
        Returns:
            Upsert response with stats
        """
        total_upserted = 0
        
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            try:
                response = self.index.upsert(vectors=batch, namespace=namespace)
                total_upserted += response.upserted_count
                logger.debug(f"Upserted {response.upserted_count} vectors to {namespace}")
            except Exception as e:
                logger.error(f"Failed to upsert batch: {e}")
                raise
        
        return {"upserted_count": total_upserted}
    
    def query_vectors(
        self,
        vector: List[float],
        namespace: str,
        top_k: int = 5,
        filter_dict: Optional[Dict[str, Any]] = None,
        include_metadata: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Query vectors by similarity.
        
        Args:
            vector: Query vector
            namespace: Namespace to query
            top_k: Number of results to return
            filter_dict: Optional metadata filter
            include_metadata: Whether to include metadata in results
            
        Returns:
            List of matching vectors with scores
        """
        try:
            response = self.index.query(
                vector=vector,
                namespace=namespace,
                top_k=top_k,
                filter=filter_dict,
                include_metadata=include_metadata
            )
            
            return [
                {
                    "id": match.id,
                    "score": match.score,
                    "values": match.values if hasattr(match, 'values') else None,
                    "metadata": match.metadata if include_metadata else None
                }
                for match in response.matches
            ]
        except Exception as e:
            logger.error(f"Failed to query vectors: {e}")
            raise
    
    def delete_vectors(
        self,
        namespace: str,
        ids: Optional[List[str]] = None,
        filter_dict: Optional[Dict[str, Any]] = None,
        delete_all: bool = False
    ) -> Dict[str, Any]:
        """
        Delete vectors from index.
        
        Args:
            namespace: Namespace to delete from
            ids: Optional list of vector IDs to delete
            filter_dict: Optional filter for deletion
            delete_all: If True, delete all vectors in namespace
            
        Returns:
            Deletion response
        """
        try:
            if delete_all:
                self.index.delete(delete_all=True, namespace=namespace)
                logger.info(f"Deleted all vectors in namespace: {namespace}")
            elif ids:
                self.index.delete(ids=ids, namespace=namespace)
                logger.info(f"Deleted {len(ids)} vectors from {namespace}")
            elif filter_dict:
                self.index.delete(filter=filter_dict, namespace=namespace)
                logger.info(f"Deleted vectors matching filter from {namespace}")
            
            return {"success": True, "namespace": namespace}
            
        except Exception as e:
            logger.error(f"Failed to delete vectors: {e}")
            raise
    
    def fetch_vectors(
        self,
        ids: List[str],
        namespace: str
    ) -> Dict[str, Dict[str, Any]]:
        """
        Fetch specific vectors by ID.
        
        Args:
            ids: List of vector IDs
            namespace: Namespace to fetch from
            
        Returns:
            Dictionary of ID to vector data
        """
        try:
            response = self.index.fetch(ids=ids, namespace=namespace)
            return {
                vid: {
                    "id": vid,
                    "values": data.values if hasattr(data, 'values') else None,
                    "metadata": data.metadata if hasattr(data, 'metadata') else None
                }
                for vid, data in response.vectors.items()
            }
        except Exception as e:
            logger.error(f"Failed to fetch vectors: {e}")
            raise
    
    def list_vectors(
        self,
        namespace: str,
        prefix: Optional[str] = None,
        limit: int = 100
    ) -> List[str]:
        """
        List vector IDs in namespace.
        
        Args:
            namespace: Namespace to list
            prefix: Optional ID prefix filter
            limit: Maximum number of IDs to return
            
        Returns:
            List of vector IDs
        """
        try:
            # Use query with dummy vector to list vectors
            # This is a workaround since Pinecone doesn't have a direct list operation
            results = []
            
            # Paginate through results
            pagination_token = None
            while len(results) < limit:
                response = self.index.list_paginated(
                    namespace=namespace,
                    prefix=prefix,
                    limit=min(limit - len(results), 100),
                    pagination_token=pagination_token
                )
                
                results.extend([v.id for v in response.vectors])
                
                if not response.pagination or not response.pagination.next:
                    break
                pagination_token = response.pagination.next
            
            return results[:limit]
            
        except Exception as e:
            logger.error(f"Failed to list vectors: {e}")
            # Fallback: return empty list
            return []
    
    def get_index_stats(self, namespace: Optional[str] = None) -> Dict[str, Any]:
        """
        Get index statistics.
        
        Args:
            namespace: Optional namespace to get stats for
            
        Returns:
            Index statistics
        """
        try:
            stats = self.index.describe_index_stats()
            
            result = {
                "total_vector_count": stats.total_vector_count,
                "dimension": stats.dimension,
            }
            
            if namespace and hasattr(stats, 'namespaces'):
                ns_stats = stats.namespaces.get(namespace)
                if ns_stats:
                    result["namespace_vector_count"] = ns_stats.vector_count
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get index stats: {e}")
            raise
    
    def health_check(self) -> Dict[str, Any]:
        """
        Perform health check on Pinecone connection.
        
        Returns:
            Health status dictionary
        """
        try:
            stats = self.get_index_stats()
            return {
                "status": "healthy",
                "index_name": self.cfg.index_name,
                "total_vectors": stats.get("total_vector_count", 0),
                "dimension": stats.get("dimension", self.cfg.dimension)
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "index_name": self.cfg.index_name
            }


# Global client instance
def get_pinecone_client() -> PineconeClient:
    """Get the global Pinecone client instance."""
    return PineconeClient()


@contextmanager
def pinecone_session():
    """Context manager for Pinecone operations."""
    client = get_pinecone_client()
    try:
        yield client
    except Exception as e:
        logger.error(f"Pinecone session error: {e}")
        raise
