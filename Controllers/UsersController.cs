using Microsoft.AspNetCore.Mvc;
using csharp_hello_world.Models.DTOs;
using csharp_hello_world.Services;

namespace csharp_hello_world.Controllers;

/// <summary>
/// 사용자 관리 RESTful API 컨트롤러
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;

    // 생성자를 통한 의존성 주입 (DI)
    public UsersController(IUserService userService, ILogger<UsersController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// 모든 사용자 목록 조회: GET /api/users
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserResponse>>> GetAll()
    {
        _logger.LogInformation("전체 사용자 목록 조회 요청");
        var users = await _userService.GetAllUsersAsync();
        return Ok(users);
    }

    /// <summary>
    /// ID로 사용자 단건 조회: GET /api/users/{id}
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<UserResponse>> GetById(int id)
    {
        var user = await _userService.GetUserByIdAsync(id);
        if (user == null)
        {
            return NotFound(new { message = $"ID가 {id}인 사용자를 찾을 수 없습니다." });
        }

        return Ok(user);
    }

    /// <summary>
    /// 신규 사용자 생성: POST /api/users
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<UserResponse>> Create([FromBody] CreateUserRequest request)
    {
        var created = await _userService.CreateUserAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>
    /// 사용자 정보 수정: PUT /api/users/{id}
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<UserResponse>> Update(int id, [FromBody] UpdateUserRequest request)
    {
        var updated = await _userService.UpdateUserAsync(id, request);
        if (updated == null)
        {
            return NotFound(new { message = $"ID가 {id}인 사용자를 찾을 수 없습니다." });
        }

        return Ok(updated);
    }

    /// <summary>
    /// 사용자 삭제: DELETE /api/users/{id}
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _userService.DeleteUserAsync(id);
        if (!deleted)
        {
            return NotFound(new { message = $"ID가 {id}인 사용자를 찾을 수 없습니다." });
        }

        return NoContent();
    }
}
