namespace csharp_hello_world.Models.DTOs;

/// <summary>
/// 사용자 생성 요청 DTO
/// </summary>
public record CreateUserRequest(
    string Name,
    string Email
);

/// <summary>
/// 사용자 정보 수정 요청 DTO
/// </summary>
public record UpdateUserRequest(
    string Name,
    bool IsActive
);

/// <summary>
/// 사용자 조회 응답 DTO
/// </summary>
public record UserResponse(
    int Id,
    string Name,
    string Email,
    DateTime CreatedAt,
    bool IsActive
);
