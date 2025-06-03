package controller

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/service"
	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/comment"
	"github.com/KennedySurianto/tpa_web/backend/shared/gen/like_comment"
	userpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/user"
)

type CommentController struct {
	pb.UnimplementedCommentServiceServer
	svc service.CommentService
	userClient userpb.UserServiceClient
	likeCommentController LikeCommentController
}

func NewCommentController(svc service.CommentService, userClient userpb.UserServiceClient, likeCommentController LikeCommentController) *CommentController {
	return &CommentController{
		svc: svc,
		userClient: userClient,
		likeCommentController: likeCommentController,
	}
}

func (c *CommentController) GetComments(ctx context.Context, req *pb.GetCommentsRequest) (*pb.GetCommentsResponse, error) {
    comments, err := c.svc.GetComments(ctx, uint(req.VideoId))
    if err != nil {
        return nil, err
    }

    var pbComments []*pb.Comment

    for _, comment := range comments {
        // Call UserService to get user info by user ID
        user, err := c.userClient.GetUserById(ctx, &userpb.GetUserByIdRequest{Id: uint64(comment.UserID)})
        if err != nil {
            // Handle error, maybe skip user or fill with default data
            // For now, let's just log and continue with empty user
            fmt.Printf("Error fetching user %d: %v\n", comment.UserID, err)
			user = &userpb.User{
				Id:        0,
				Username:  "Unknown",
				AvatarUrl: "",
			}
        }

        pbComments = append(pbComments, &pb.Comment{
            Id:        uint64(comment.ID),
            UserId:    uint64(comment.UserID),
            VideoId:   uint64(comment.VideoID),
            Content:   comment.Content,
            CreatedAt: comment.CreatedAt.Format(time.RFC3339),
            UpdatedAt: comment.UpdatedAt.Format(time.RFC3339),
            User: &pb.User{
				Id:         user.Id,
                Username:   user.Username,
                ProfileUrl: user.AvatarUrl,
            },
			IsLiked: func() bool {
				if req.UserId == 0 {
					return false
				}
				resp, err := c.likeCommentController.IsCommentLiked(ctx, &like_comment.IsCommentLikedRequest{
					UserId:   uint32(req.UserId),
					CommentId: uint32(comment.ID),
				})
				if err != nil || resp == nil {
					return false
				}
				return resp.Liked
			}(),
			LikeCount: func() uint64 {
				resp, err := c.likeCommentController.GetLikeCount(ctx, &like_comment.GetLikeCountRequest{CommentId: uint32(comment.ID)})
				if err != nil || resp == nil {
					return 0
				}
				return resp.Count
			}(),
        })
    }

    return &pb.GetCommentsResponse{Comments: pbComments}, nil
}

func (h *CommentController) CreateComment(ctx context.Context, req *pb.CreateCommentRequest) (*pb.CreateCommentResponse, error) {
	userId, err := strconv.ParseUint(req.UserId, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid user id: %v", err)
	}
	videoId, err := strconv.ParseUint(req.VideoId, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid video id: %v", err)
	}
	fmt.Println("[COMMENT_CONTROLLER] CreateComment called with userId:", userId, "videoId:", videoId, "content:", req.Content)
	comment, err := h.svc.CreateComment(ctx, userId, videoId, req.Content)
	if err != nil {
		return nil, err
	}
	fmt.Println("[COMMENT_CONTROLLER] Comment created:", comment)

	return &pb.CreateCommentResponse{
		Comment: &pb.Comment{
			UserId:    uint64(comment.UserID),
			VideoId:   uint64(comment.VideoID),
			Content:   comment.Content,
		},
	}, nil
}