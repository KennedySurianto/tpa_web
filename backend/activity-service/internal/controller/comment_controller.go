package controller

import (
	"context"
	"fmt"
	"time"

	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/service"
	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/comment"
	"github.com/KennedySurianto/tpa_web/backend/shared/gen/like_comment"
	userpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/user"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
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
				Id:        	0,
				Username:  	"Unknown",
				Avatar: 	nil,
			}
        }

        pbComments = append(pbComments, &pb.Comment{
            Id:        uint64(comment.ID),
            CreatedAt: comment.CreatedAt.Format(time.RFC3339),
            UpdatedAt: comment.UpdatedAt.Format(time.RFC3339),
            
			UserId:    uint64(comment.UserID),
            VideoId:   uint64(comment.VideoID),
            Content:   comment.Content,

			User: &pb.User{
				Id:         user.Id,
                Username:   user.Username,
                Avatar: 	user.Avatar,
            },
			Replies: func() []*pb.Comment {
				replies, err := c.svc.GetReplies(ctx, comment.ID)
				if err != nil || replies == nil {
					return nil
				}
				var pbReplies []*pb.Comment
				for _, reply := range replies {
					// Get user info for the reply
					replyUser, err := c.userClient.GetUserById(ctx, &userpb.GetUserByIdRequest{Id: uint64(reply.UserID)})
					if err != nil {
						fmt.Printf("Error fetching user %d for reply: %v\n", reply.UserID, err)
						replyUser = &userpb.User{
							Id:        	0,
							Username:  	"Unknown",
							Avatar: 	nil,
						}
					}

					// Get IsLiked status
					isLiked := false
					if req.UserId != 0 {
						resp, err := c.likeCommentController.IsCommentLiked(ctx, &like_comment.IsCommentLikedRequest{
							UserId:   uint32(req.UserId),
							CommentId: uint32(reply.ID),
						})
						if err == nil && resp != nil {
							isLiked = resp.Liked
						}
					}

					// Get LikeCount
					likeCount := uint64(0)
					likeResp, err := c.likeCommentController.GetLikeCount(ctx, &like_comment.GetLikeCountRequest{
						CommentId: uint32(reply.ID),
					})
					if err == nil && likeResp != nil {
						likeCount = likeResp.Count
					}

					pbReplies = append(pbReplies, &pb.Comment{
						Id:        uint64(reply.ID),
						CreatedAt: reply.CreatedAt.Format(time.RFC3339),
						UpdatedAt: reply.UpdatedAt.Format(time.RFC3339),
						UserId:    uint64(reply.UserID),
						VideoId:   uint64(reply.VideoID),
						Content:   reply.Content,
						ReplyToId: func() uint64 {
							if reply.ReplyToID != nil {
								return uint64(*reply.ReplyToID)
							}
							return 0
						}(),
						User: &pb.User{
							Id:         replyUser.Id,
							Username:   replyUser.Username,
							Avatar: 	replyUser.Avatar,
						},
						IsLiked:   isLiked,
						LikeCount: likeCount,
					})
				}
				return pbReplies
			}(),
			
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
	userId := uint64(req.UserId)
	videoId := uint64(req.VideoId)
	replyToId := uint64(req.ReplyToId)
	fmt.Println("[COMMENT_CONTROLLER] CreateComment called with userId:", userId, "videoId:", videoId, "content:", req.Content)
	comment, err := h.svc.CreateComment(ctx, userId, videoId, replyToId, req.Content)
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

func (c *CommentController) GetCommentCount(ctx context.Context, req *pb.GetCommentCountRequest) (*pb.GetCommentCountResponse, error) {
	count, err := c.svc.GetCommentCount(uint(req.VideoId))
	if err != nil {
		return nil, err
	}
	return &pb.GetCommentCountResponse{Count: uint64(count)}, nil
}

func (c *CommentController) DeleteComment(ctx context.Context, req *pb.DeleteCommentRequest) (*pb.DeleteCommentResponse, error) {
	err := c.svc.DeleteComment(ctx, uint(req.Id))
	if err != nil {
		return &pb.DeleteCommentResponse{Success: false}, status.Errorf(codes.Internal, "failed to delete comment: %v", err)
	}
	return &pb.DeleteCommentResponse{Success: true}, nil
}

